import { supabase } from "../../../shared/supabase/client";
import type { AuthRepository, LoginResult } from "../domain/AuthRepository";
import toDomainUser from "./userMapper";

export class LoginRepository implements AuthRepository {
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
