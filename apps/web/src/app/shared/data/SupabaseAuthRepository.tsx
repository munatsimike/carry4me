import type { AuthRepository } from "../Authentication/domain/AuthRepository";
import type { RepoResponse } from "../domain/RepoResponse";
import type {
  AppUser,
  LoginResult,
  UserProfile,
} from "../Authentication/domain/authTypes";
import { supabase } from "@/app/shared/supabase/client";
import type { UpdateProfileDto } from "../Authentication/application/updateProfileDTO";
import type { UpdateAuthDto } from "../Authentication/application/UpdateAuthDto";
import type { User } from "@supabase/supabase-js";

const emptyRepoResult: RepoResponse<string> = {
  data: null,

  error: null,
};

export class SupabaseAuthRepository implements AuthRepository {
  async newPassword(newPassword: string): Promise<RepoResponse<string>> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return { data: null, error: sessionError };
    }

    if (!session) {
      return {
        data: null,
        error: new Error(
          "No recovery session found. Open the reset link from your email first.",
        ),
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) return { data: null, error };

    return { data: "success", error: null };
  }

  async resetPassword(email: string): Promise<RepoResponse<string>> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/new-password",
    });

    if (error) return { data: null, error };

    return { data: "success", error: null };
  }

  async updateAuthDetails(
    updateAuthDto: UpdateAuthDto,
  ): Promise<RepoResponse<string>> {
    const { data, error } = await supabase.auth.updateUser(updateAuthDto);
    if (error) return emptyRepoResult;
    return { data: data.user.id, error: null };
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
      return {
        data: null,
        error: {
          code: error?.code,
          message: error?.message ?? "",
          status: null,
        },
      };
    return { data: data.user?.id, error: null };
  }

  async uploadAvatar(
    file: File,
    userId: string,
  ): Promise<RepoResponse<string>> {
    const fileExt = file.name.split(".").pop();

    const uniqueId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const filePath = `${userId}/${uniqueId}.${fileExt}`;
    console.log(filePath);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return {
        data: null,
        error: {
          code: uploadError.statusCode,
          message: uploadError.message,
          status: uploadError.status,
        },
      };
    }

    const { error } = await this.updateAvataPath(userId, filePath);

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: error.status,
        },
      };
    }

    return { data: filePath, error: null };
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
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return { data: null, error: null };
  }

  async fetchUserProfile(userId: string): Promise<RepoResponse<UserProfile>> {
    const { data, status, error } = await supabase
      .from("profiles")
      .select("id,full_name, avatar_url,city,country_code,phone_number")
      .eq("id", userId)
      .single();

    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
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
      error: null,
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

    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    return { data: data, error: null };
  }

  async logout(): Promise<RepoResponse<boolean>> {
    const { error } = await supabase.auth.signOut();
    if (error) throw Error;
    if (error) {
      return { error: error, data: null };
    }

    return { data: true, error: null };
  }

  async login(email: string, password: string): Promise<RepoResponse<User>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error };
    }

    const user = data.user;

    if (!user) {
      return {
        data: null,
        error: {
          code: "",
          message: "Login succeeded but no user returned.",
        },
      };
    }
    return {
      data: user,
      error: null,
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

    if (error)
      return {
        data: null,
        error: {
          code: error.statusCode,
          message: error.message,
          status: error.status,
        },
      };
    this.updateProfile(userId, { avatar_url: null });
    return { data: "success", error: null };
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
