import { supabase } from "../../../shared/supabase/client";
import type {
  AuthRepository,
  LoginResult,
  LogoutResult,
} from "../domain/AuthRepository";
import toDomainUser from "./userMapper";

export class SupabaseAuthRepository implements AuthRepository {
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
