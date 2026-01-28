// oauth.ts (or at bottom of AuthModal.tsx)

import { supabase } from "@/app/shared/supabase/client";

export type OAuthProvider = "google" | "facebook" | "twitter";

export async function signInWithProvider(
  provider: OAuthProvider,
  redirectTo?: string,
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  });
}
