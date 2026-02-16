import { supabase } from "../supabase/client";
import type {
  AuthRepository,
  LoginResult,
  LogoutResult,
} from "../Authentication/domain/AuthRepository";
import toDomainUser from "./userMapper";
import type { RepoResponse } from "../domain/RepoResponse";

export class SupabaseAuthRepository implements AuthRepository {
  async fetchUserName(userId: string): Promise<RepoResponse<string>> {
    const { data, status, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    if (error) return { data: null, status, error };
    return {
      data: data.full_name,
      status: status,
      error: error,
    };
  }

  async logout(): Promise<LogoutResult> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
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
