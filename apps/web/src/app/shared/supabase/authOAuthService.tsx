
// OAuth provider helpers for future social sign-in

import { supabase } from "@/app/shared/supabase/client";

export type authOAuthService = "google" | "facebook" | "twitter";

export async function signInWithProvider(
  provider: authOAuthService,
  redirectTo?: string,
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  });
}
