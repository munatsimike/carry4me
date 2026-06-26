import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { supabase } from "@/app/shared/supabase/client";
import { getDefaultAuthedPath } from "../domain/accountStatus";
import type { UserProfile } from "../domain/authTypes";
import {
  COMPLETE_PROFILE_PATH,
  needsCompleteProfile,
} from "../domain/profileCompletion";

const NON_REDIRECT_AUTH_PATHS = new Set([
  "/",
  "/signin",
  "/verify-email",
  COMPLETE_PROFILE_PATH,
]);

export function sanitizePostAuthRedirect(redirectTo?: string): string | undefined {
  const trimmed = redirectTo?.trim();
  if (!trimmed) return undefined;

  const pathname = trimmed.split(/[?#]/)[0];
  if (NON_REDIRECT_AUTH_PATHS.has(pathname)) return undefined;

  return trimmed;
}

export function getAuthenticatedLandingPath(
  profile: UserProfile | null,
  redirectTo?: string,
): string {
  if (!profile || needsCompleteProfile(profile)) {
    return COMPLETE_PROFILE_PATH;
  }

  const customRedirect = sanitizePostAuthRedirect(redirectTo);
  if (customRedirect) return customRedirect;

  return getDefaultAuthedPath(profile);
}

export async function resolveAuthenticatedLandingPath(
  redirectTo?: string,
): Promise<string> {
  const sanitizedRedirect = sanitizePostAuthRedirect(redirectTo);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return sanitizedRedirect || "/dashboard";
  }

  const authRepo = new SupabaseAuthRepository();
  const profile = await authRepo.fetchUserProfile(user.id);
  return getAuthenticatedLandingPath(profile, redirectTo);
}
