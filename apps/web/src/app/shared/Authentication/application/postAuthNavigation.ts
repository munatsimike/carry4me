import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { supabase } from "@/app/shared/supabase/client";
import { getDefaultAuthedPath } from "../domain/accountStatus";
import type { UserProfile } from "../domain/authTypes";
import {
  COMPLETE_PROFILE_PATH,
  needsCompleteProfile,
} from "../domain/profileCompletion";

export function getAuthenticatedLandingPath(
  profile: UserProfile | null,
  redirectTo?: string,
): string {
  if (!profile || needsCompleteProfile(profile)) {
    return COMPLETE_PROFILE_PATH;
  }

  const customRedirect = redirectTo?.trim();
  if (customRedirect) return customRedirect;

  return getDefaultAuthedPath(profile);
}

export async function resolveAuthenticatedLandingPath(
  redirectTo?: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectTo?.trim() || "/dashboard";
  }

  const authRepo = new SupabaseAuthRepository();
  const profile = await authRepo.fetchUserProfile(user.id);
  return getAuthenticatedLandingPath(profile, redirectTo);
}
