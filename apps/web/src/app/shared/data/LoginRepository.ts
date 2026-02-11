import { supabase } from "../supabase/client";
import type {
  AuthRepository,
  LoginResult,
  LogoutResult,
  User,
} from "../Authentication/domain/AuthRepository";
import toDomainUser from "./userMapper";

export class SupabaseAuthRepository implements AuthRepository {
  async fetchUserName(userId: string): Promise<string> {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single()
      .throwOnError();
    return data.full_name;
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
