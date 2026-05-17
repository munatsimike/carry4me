import type { AuthRepository } from "../Authentication/domain/AuthRepository";
import type {
  AppUser,
  UserProfile,
} from "../Authentication/domain/authTypes";
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from "../Authentication/domain/accountStatus";
import { supabase } from "@/app/shared/supabase/client";
import type { UpdateProfileDto } from "../Authentication/application/updateProfileDTO";
import type { UpdateAuthDto } from "../Authentication/application/UpdateAuthDto";
import type { User } from "@supabase/supabase-js";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import {
  AppError,
  requireData,
  throwIfSupabaseError,
} from "@/app/shared/domain/AppError";
import { toCountryName } from "@/app/Mapper";

const profileCountryToIsoCountry: Record<string, CountryCode> = {
  GB: "GB",
  UK: "GB",
  "UNITED KINGDOM": "GB",
  US: "US",
  USA: "US",
  "UNITED STATES": "US",
  ZW: "ZW",
  ZIMBABWE: "ZW",
};

function normalizeProfileCountry(country: string | null): CountryCode | null {
  if (!country) return null;

  const normalized = country.trim().toUpperCase();
  return profileCountryToIsoCountry[normalized] ?? null;
}

function parsePhoneCountry(phoneNumber: string | null | undefined): {
  phoneCountryCode: string | null;
  isoCountry: CountryCode | null;
} {
  if (!phoneNumber) {
    return { phoneCountryCode: null, isoCountry: null };
  }

  try {
    const parsed = parsePhoneNumberFromString(phoneNumber);

    if (!parsed) {
      return { phoneCountryCode: null, isoCountry: null };
    }

    return {
      phoneCountryCode: parsed.country ?? `+${parsed.countryCallingCode}`,
      isoCountry: parsed.country ?? null,
    };
  } catch {
    return { phoneCountryCode: null, isoCountry: null };
  }
}

function buildVerifiedPhoneProfileUpdate(
  phoneNumber: string,
  countryCode: string,
) {
  const { phoneCountryCode, isoCountry } = parsePhoneCountry(phoneNumber);
  const profileIsoCountry = normalizeProfileCountry(countryCode);
  const securityReviewRequired = Boolean(
    isoCountry && profileIsoCountry && isoCountry !== profileIsoCountry,
  );
  const country = toCountryName(countryCode);

  return {
    phone_number: phoneNumber,
    phone_verified: true,
    country_code: countryCode,
    country,
    phone_country_code: phoneCountryCode,
    security_review_required: securityReviewRequired,
    account_status: securityReviewRequired
      ? ACCOUNT_STATUSES.PENDING_REVIEW
      : ACCOUNT_STATUSES.ACTIVE,
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

    const profilePhoneNumber = user.phone ?? appUser.profile.phoneNumber;
    const { phoneCountryCode, isoCountry } = parsePhoneCountry(user.phone);
    const profileIsoCountry = normalizeProfileCountry(appUser.profile.countryCode);
    const securityReviewRequired = Boolean(
      isoCountry && profileIsoCountry && isoCountry !== profileIsoCountry,
    );

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: appUser.profile.fullName,
        avatar_url: appUser.profile.avatarUrl,
        country_code: appUser.profile.countryCode,
        phone_number: profilePhoneNumber,
        city: appUser.profile.city,
        email: appUser.profile.email,
        phone_verified: true,
        phone_country_code: phoneCountryCode,
        security_review_required: securityReviewRequired,
        account_status: securityReviewRequired
          ? ACCOUNT_STATUSES.PENDING_REVIEW
          : ACCOUNT_STATUSES.ACTIVE,
      }, { onConflict: "id" })
      .select("id")
      .single();

    throwIfSupabaseError(error);

    return requireData(data).id;
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

    const publicUrl = fetchPublicUrl(profile.avatar_url);

    return {
      id: profile.id,
      fullName: profile.full_name,
      avatarUrl: publicUrl,
      countryCode: profile.country_code,
      city: profile.city,
      phoneNumber: profile.phone_number,
      phoneCountryCode: profile.phone_country_code,
      email: profile.email,
      phoneVerified: profile.phone_verified === true,
      securityReviewRequired: profile.security_review_required === true,
      accountStatus: toAccountStatus(profile.account_status),
    };
  }

  async updateProfile(
    userId: string,
    updateProfile: Partial<UpdateProfileDto>,
  ): Promise<string> {
    const { error, status } = await supabase
      .from("profiles")
      .update(updateProfile)
      .eq("id", userId);

    throwIfSupabaseError(error, status);

    return userId;
  }

  async logout(): Promise<boolean> {
    const { error } = await supabase.auth.signOut();
    throwIfSupabaseError(error);
    return true;
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

    const verifiedPhoneNumber = user.phone;

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

    const { error: profileError, status } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          phone_number: verifiedPhoneNumber,
          phone_verified: true,
          country_code: countryCode,
          country,
        },
        { onConflict: "id" },
      );

    throwIfSupabaseError(profileError, status);

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
}

export function fetchPublicUrl(avatar_url: string | null): string | null {
  if (!avatar_url) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatar_url);
  return `${data.publicUrl}?t=${Date.now()}`;
}
