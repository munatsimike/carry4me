import type { AuthRepository } from "../Authentication/domain/AuthRepository";
import type { AppUser, UserProfile } from "../Authentication/domain/authTypes";
import { supabase } from "@/app/shared/supabase/client";
import type { UpdateProfileDto } from "../Authentication/application/updateProfileDTO";
import type { UpdateAuthDto } from "../Authentication/application/UpdateAuthDto";
import type { User } from "@supabase/supabase-js";
import {
  AppError,
  requireData,
  throwIfSupabaseError,
} from "@/app/shared/domain/AppError";

const redirectUrl = import.meta.env.DEV
  ? "http://localhost:5173/new-password"
  : "https://www.carry4me.uk/new-password";

export class SupabaseAuthRepository implements AuthRepository {
  async newPassword(newPassword: string): Promise<string> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    throwIfSupabaseError(sessionError);

    if (!session) {
      throw new AppError({
        code: "NO_SESSION",
        message:
          "No recovery session found. Open the reset link from your email first.",
      });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    throwIfSupabaseError(error);

    return "success";
  }

  async resetPassword(email: string): Promise<string> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    throwIfSupabaseError(error);

    return "success";
  }

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

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: appUser.profile.fullName,
        avatar_url: appUser.profile.avatarUrl,
        country_code: appUser.profile.countryCode,
        phone_number: user.phone,
        city: appUser.profile.city,
        email: appUser.profile.email,
        phone_verified: true,
      })
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
    const { data, status, error } = await supabase
      .from("profiles")
      .select(
        "id,full_name,avatar_url,city,country_code,phone_number,phone_verified,email",
      )
      .eq("id", userId)
      .maybeSingle();

    throwIfSupabaseError(error, status);

    if (!data) {
      return null;
    }

    const publicUrl = fetchPublicUrl(data.avatar_url);

    return {
      id: data.id,
      fullName: data.full_name,
      avatarUrl: publicUrl,
      countryCode: data.country_code,
      city: data.city,
      phoneNumber: data.phone_number,
      email: data.email,
      phoneVerified: data.phone_verified === true,
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

    return "OTP sent successfully";
  }

  async verifyPhoneOTP(phoneNumber: string, token: string): Promise<User> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token,
      type: "sms",
    });

    throwIfSupabaseError(error);

    const user = requireData(data.user, "No user returned after OTP verification");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    throwIfSupabaseError(profileError);

    if (profile) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone_verified: true })
        .eq("id", user.id);

      throwIfSupabaseError(updateError);
    }

    return user;
  }
}

export function fetchPublicUrl(avatar_url: string | null): string | null {
  if (!avatar_url) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatar_url);
  return `${data.publicUrl}?t=${Date.now()}`;
}
