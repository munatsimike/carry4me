import type { AuthRepository } from "../Authentication/domain/AuthRepository";
import toDomainUser from "./userMapper";
import type { RepoResponse } from "../domain/RepoResponse";
import type {
  AppUser,
  LoginResult,
  LogoutResult,
  UserProfile,
} from "../Authentication/domain/authTypes";
import { supabase } from "@/app/shared/supabase/client";
import type { UpdateProfileDto } from "../Authentication/application/updateProfileDTO";

export class SupabaseAuthRepository implements AuthRepository {
  async signUp(appUser: AppUser): Promise<RepoResponse<string>> {
    const { data, error } = await supabase.auth.signUp({
      email: appUser.auth.email,
      password: appUser.auth.password,
      options: {
        data: {
          full_name: appUser.profile.fullName,
          avatar_url: appUser.profile.avatarUrl,
          country_code: appUser.profile.countryCode,
          phone_number: appUser.profile.phoneNumber,
          city: appUser.profile.city,
        },
      },
    });

    if (error || !data.user?.id)
      return { data: null, error: error?.message, status: null };
    return { data: data.user?.id, error: null, status: null };
  }

  async uploadAvatar(
    file: File,
    userId: string,
  ): Promise<RepoResponse<string>> {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return { data: null, error: uploadError.message, status: null };
    }

    const updateResult = await this.updateAvataPath(userId, filePath);

    if (updateResult.error) {
      return { data: null, error: updateResult.error, status: null };
    }

    return { data: filePath, error: null, status: null };
  }

  async updateAvataPath(
    userId: string,
    path: string,
  ): Promise<RepoResponse<null>> {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", userId);

    if (error) {
      return { data: null, error, status: null };
    }

    return { data: null, error: null, status: null };
  }

  async fetchUserProfile(userId: string): Promise<RepoResponse<UserProfile>> {
    const { data, status, error } = await supabase
      .from("profiles")
      .select("id,full_name, avatar_url,city,country_code,phone_number")
      .eq("id", userId)
      .single();

    if (error) return { data: null, status, error };
    const publicUrl = fetchPublicUrl(data.avatar_url);
    return {
      data: {
        id: data.id,
        fullName: data.full_name,
        avatarUrl: publicUrl,
        countryCode: data.country_code,
        city: data.city,
        phoneNumber: data.phone_number,
      },
      status: status,
      error: error,
    };
  }

  async updateProfile(
    userId: string,
    updateProfile: Partial<UpdateProfileDto>,
  ): Promise<RepoResponse<string>> {
    const { data, status, error } = await supabase
      .from("profiles")
      .update(updateProfile)
      .eq("id", userId);
      if(error)throw Error
   // if (error) return { data: null, status, error };
    return { data: data, error: null, status: null };
  }

  async logout(): Promise<LogoutResult> {
    const { error } = await supabase.auth.signOut();
    if (error) throw Error;
    if (error) {
      // return { success: false, error: error.message };
    }

    return { success: true };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = data.user;

    if (!user) {
      return { success: false, error: "Login succeeded but no user returned." };
    }

    // Map Supabase user -> your domain user (keep it minimal)
    return {
      success: true,
      user: toDomainUser(user),
    };
  }
}
export function fetchPublicUrl(avatar_url: string | null): string | null {
  if (!avatar_url) return null;

  const { data } = supabase.storage.from("avatars").getPublicUrl(avatar_url);

  return `${data.publicUrl}?t=${Date.now()}`;
}
