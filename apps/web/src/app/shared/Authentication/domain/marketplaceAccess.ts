import type { UserProfile } from "./authTypes";
import { COMPLETE_PROFILE_PATH, isProfileIncomplete } from "./profileCompletion";

export type MarketplaceAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "complete_profile" | "verify_email" };

export function getMarketplaceAccess(
  profile: UserProfile | null,
): MarketplaceAccessResult {
  if (!profile || isProfileIncomplete(profile)) {
    return { allowed: false, reason: "complete_profile" };
  }

  if (profile.emailVerified !== true) {
    return { allowed: false, reason: "verify_email" };
  }

  return { allowed: true };
}

export { COMPLETE_PROFILE_PATH };
