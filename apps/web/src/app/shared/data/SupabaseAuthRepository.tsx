import type { AuthRepository } from "../Authentication/domain/AuthRepository";
import type { AppUser, UserProfile } from "../Authentication/domain/authTypes";
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from "../Authentication/domain/accountStatus";
import { isProfileIncomplete } from "../Authentication/domain/profileCompletion";
import { supabase } from "@/app/shared/supabase/client";
import type { UpdateProfileDto } from "../Authentication/application/updateProfileDTO";
import type { UpdateAuthDto } from "../Authentication/application/UpdateAuthDto";
import type { User } from "@supabase/supabase-js";
import {
  AppError,
  requireData,
  throwIfSupabaseError,
} from "@/app/shared/domain/AppError";
import { toCountryName } from "@/app/Mapper";
import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";

function buildVerifiedPhoneProfileUpdate(
  phoneNumber: string,
  countryCode: string,
) {
  const country = toCountryName(countryCode);

  return {
    phone_number: phoneNumber,
    phone_verified: true,
    country_code: countryCode,
    country,
    account_status: ACCOUNT_STATUSES.ACTIVE,
  };
}

function toAccountStatus(value: unknown): AccountStatus {
  if (
    value === ACCOUNT_STATUSES.PENDING_REVIEW ||
    value === ACCOUNT_STATUSES.SUSPENDED
  ) {
    return value;
  }

  return ACCOUNT_STATUSES.ACTIVE;
}

function isMissingProfileCountryColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; message?: unknown };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === "PGRST204" ||
    (message.includes("country") && message.includes("schema cache")) ||
    (message.includes("country") && message.includes("column"))
  );
}

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; message?: unknown };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("not allowed")
  );
}

function normalizeFullName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "";

  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toUserProfile(profile: Record<string, any>): UserProfile {
  const publicUrl = fetchPublicUrl(profile.avatar_url ?? null);
  return {
    id: profile.id,
    fullName: profile.full_name,
    avatarUrl: publicUrl,
    country: profile.country ?? null,
    countryCode: profile.country_code,
    city: profile.city,
    phoneNumber: profile.phone_number,
    email: profile.email,
    emailVerified: profile.email_verified === true,
    phoneVerified: profile.phone_verified === true,
    accountStatus: toAccountStatus(profile.account_status),
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  async updateAuthDetails(updateAuthDto: UpdateAuthDto): Promise<string> {
    const { data, error } = await supabase.auth.updateUser(updateAuthDto);
    throwIfSupabaseError(error);
    return requireData(data.user).id;
  }

  async completeProfile(appUser: AppUser): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AppError({
        code: "NO_USER",
        message: "No authenticated user found",
      });
    }

    const { data, error } = await supabase.rpc("complete_current_profile", {
      p_full_name: normalizeFullName(appUser.profile.fullName),
      p_city: appUser.profile.city,
      p_country_code: appUser.profile.countryCode,
      p_country: appUser.profile.country ?? null,
      p_email: appUser.profile.email,
    });

    throwIfSupabaseError(error);

    return requireData(data) as string;
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();

    const uniqueId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const filePath = `${userId}/${uniqueId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    throwIfSupabaseError(
      uploadError
        ? {
            message: uploadError.message,
            code: uploadError.name,
          }
        : null,
      uploadError?.status ?? null,
    );

    await this.updateAvataPath(userId, filePath);

    return filePath;
  }

  private async updateAvataPath(userId: string, path: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", userId);

    throwIfSupabaseError(error);
  }

  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, status, error } = await supabase.rpc("get_current_profile");

    throwIfSupabaseError(error, status);

    const profile = data?.[0];

    if (!profile || profile.id !== userId) {
      return null;
    }

    return toUserProfile(profile);
  }

  async updateProfile(
    userId: string,
    updateProfile: Partial<UpdateProfileDto>,
  ): Promise<string> {
    const normalizedUpdate = {
      ...updateProfile,
      ...(typeof updateProfile.full_name === "string"
        ? { full_name: normalizeFullName(updateProfile.full_name) }
        : {}),
    };

    const { error, status } = await supabase
      .from("profiles")
      .update(normalizedUpdate)
      .eq("id", userId);

    throwIfSupabaseError(error, status);

    return userId;
  }

  async logout(): Promise<boolean> {
    const { error } = await supabase.auth.signOut();
    throwIfSupabaseError(error);
    return true;
  }

  async deleteAccount(): Promise<void> {
    await invokeStripeFunction<{ ok: boolean }>("delete-account", {});
  }

  async deleteAvatar(
    userId: string,
    publicUrl: string,
    bucketName: string = "avatars",
  ): Promise<string> {
    const path = this.extractStoragePath(publicUrl, bucketName);
    if (!path) {
      throw new AppError({
        code: "INVALID_PATH",
        message: "Could not resolve avatar storage path",
      });
    }

    const { error } = await supabase.storage.from("avatars").remove([path]);

    throwIfSupabaseError(
      error
        ? {
            message: error.message,
            code: error.name,
          }
        : null,
      error?.status ?? null,
    );

    await this.updateProfile(userId, { avatar_url: null });
    return "success";
  }

  extractStoragePath(url: string, bucket: string) {
    const marker = `/object/public/${bucket}/`;
    const path = url.split(marker)[1] ?? null;

    return path?.split("?")[0] ?? null;
  }

  async sendPhoneOTP(phoneNumber: string): Promise<string> {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    throwIfSupabaseError(error);

    return "Verification code sent";
  }

  async verifyPhoneOTP(
    phoneNumber: string,
    token: string,
    countryCode: string,
  ): Promise<User> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token,
      type: "sms",
    });

    throwIfSupabaseError(error);

    const user = requireData(
      data.user,
      "No user returned after phone verification",
    );

    const verifiedPhoneNumber = user.phone ?? phoneNumber;

    if (!verifiedPhoneNumber) {
      throw new AppError({
        code: "PHONE_NOT_VERIFIED",
        message: "No verified phone number returned after verification",
      });
    }

    const country = toCountryName(countryCode);

    if (!country) {
      throw new AppError({
        code: "UNSUPPORTED_COUNTRY",
        message: "Select a supported country code",
      });
    }

    try {
      const existingProfile = await this.fetchUserProfile(user.id);

      if (existingProfile && !isProfileIncomplete(existingProfile)) {
        return user;
      }
    } catch {
      // Login has already succeeded; profile sync below is a best-effort repair.
    }

    const profilePayload = {
      id: user.id,
      phone_number: verifiedPhoneNumber,
      phone_verified: true,
      country_code: countryCode,
      country,
    };

    try {
      const { error: profileError, status } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileError && isMissingProfileCountryColumn(profileError)) {
        const { country: _country, ...fallbackPayload } = profilePayload;
        const { error: fallbackError, status: fallbackStatus } = await supabase
          .from("profiles")
          .upsert(fallbackPayload, { onConflict: "id" });

        throwIfSupabaseError(fallbackError, fallbackStatus);
        return user;
      }

      throwIfSupabaseError(profileError, status);
    } catch (err) {
      if (isPermissionDenied(err)) {
        return user;
      }

      throw err;
    }

    return user;
  }

  async requestPhoneChange(phoneNumber: string): Promise<string> {
    const { error } = await supabase.auth.updateUser({
      phone: phoneNumber,
    });

    throwIfSupabaseError(error);

    return "Verification code sent";
  }

  async verifyPhoneChange(
    userId: string,
    phoneNumber: string,
    token: string,
    countryCode: string,
  ): Promise<string> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token,
      type: "phone_change",
    });

    throwIfSupabaseError(error);
    const verifiedUser = requireData(
      data.user,
      "No user returned after phone verification",
    );

    if (verifiedUser.id !== userId) {
      throw new AppError({
        code: "PHONE_VERIFICATION_USER_MISMATCH",
        message: "Phone verification did not match the signed-in user",
      });
    }

    const verifiedPhoneNumber = verifiedUser.phone;

    if (!verifiedPhoneNumber) {
      throw new AppError({
        code: "PHONE_NOT_VERIFIED",
        message: "No verified phone number returned after verification",
      });
    }

    const { error: profileError, status } = await supabase
      .from("profiles")
      .update(buildVerifiedPhoneProfileUpdate(verifiedPhoneNumber, countryCode))
      .eq("id", userId);

    throwIfSupabaseError(profileError, status);

    return userId;
  }

  async sendEmailOTP(email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new AppError({
        code: "INVALID_EMAIL",
        message: "A valid email is required",
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, country_code, city, phone_number, email, phone_verified")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    throwIfSupabaseError(profileError);

    if (!profile) {
      throw new AppError({
        code: "ACCOUNT_NOT_FOUND",
        message: "Account not found or incomplete. Sign in with Phone OTP.",
      });
    }

    const requiredFields = [
      profile.full_name,
      profile.country_code,
      profile.city,
      profile.phone_number,
      profile.email,
    ];

    const hasAllRequired = requiredFields.every(
      (value) => typeof value === "string" && value.trim().length > 0,
    );

    if (!hasAllRequired || profile.phone_verified !== true) {
      throw new AppError({
        code: "PROFILE_INCOMPLETE",
        message: "Account not found or incomplete. Sign in with Phone OTP.",
      });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    throwIfSupabaseError(error);
    return "Verification code sent";
  }

  async verifyEmailOTP(email: string, token: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new AppError({
        code: "INVALID_EMAIL",
        message: "A valid email is required",
      });
    }

    if (!/^\d{6}$/.test(token.trim())) {
      throw new AppError({
        code: "INVALID_TOKEN",
        message: "Enter the 6-digit email code.",
      });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: token.trim(),
      type: "email",
    });

    throwIfSupabaseError(error);

    const user = requireData(data.user, "No user returned after email verification");
    return user;
  }
}

export function fetchPublicUrl(avatar_url: string | null): string | null {
  if (!avatar_url) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatar_url);
  return `${data.publicUrl}?t=${Date.now()}`;
}
