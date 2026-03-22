import type { AuthRepository } from "../Authentication/domain/AuthRepository";
import type { RepoResponse } from "../domain/RepoResponse";
import type {
  AppUser,
  LoginResult,
  LogoutResult,
  UserProfile,
} from "../Authentication/domain/authTypes";
import { supabase } from "@/app/shared/supabase/client";
import type { UpdateProfileDto } from "../Authentication/application/updateProfileDTO";
import type { UpdateAuthDto } from "../Authentication/application/UpdateAuthDto";

const emptyRepoResult: RepoResponse<string> = {
  data: null,
  status: null,
  error: null,
};

export class SupabaseAuthRepository implements AuthRepository {
  async newPassword(newPassword: string): Promise<RepoResponse<string>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { data: null, error: sessionError, status: null };
  }

  if (!session) {
    return {
      data: null,
      error: new Error(
        "No recovery session found. Open the reset link from your email first."
      ),
      status: null,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) return { data: null, error, status: null };

  return { data: "success", error: null, status: null };
}

async resetPassword(email: string): Promise<RepoResponse<string>> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:5173/new-password",
  });

  if (error) return { data: null, error, status: null };

  return { data: "success", error: null, status: null };
}

  async updateAuthDetails(
    updateAuthDto: UpdateAuthDto,
  ): Promise<RepoResponse<string>> {
    const { data, error } = await supabase.auth.updateUser(updateAuthDto);
    if (error) return emptyRepoResult;
    return { data: data.user.id, error: null, status: null };
  }

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
    const { data, error, status } = await supabase
      .from("profiles")
      .update(updateProfile)
      .eq("id", userId);

    if (error) return { data: null, status, error };
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
      success:true
    };
  }

  async deleteAvatar(
    userId: string,
    publicUrl: string,
    bucketName: string = "avatars",
  ): Promise<RepoResponse<string>> {
    const path = this.extractStoragePath(publicUrl, bucketName);
    if (!path) return emptyRepoResult;
    const { error } = await supabase.storage.from("avatars").remove([path]);

    if (error) return { data: null, error: error, status: null };
    this.updateProfile(userId, { avatar_url: null });
    return { data: "success", error: null, status: null };
  }

  extractStoragePath(url: string, bucket: string) {
    const marker = `/object/public/${bucket}/`;
    const path = url.split(marker)[1] ?? null;

    return path.split("?")[0];
  }
}

export function fetchPublicUrl(avatar_url: string | null): string | null {
  if (!avatar_url) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatar_url);
  return `${data.publicUrl}?t=${Date.now()}`;
}
