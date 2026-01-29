// oauth.ts (or at bottom of AuthModal.tsx)

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
