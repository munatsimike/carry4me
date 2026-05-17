import type { UserProfile } from "./authTypes";

export const COMPLETE_PROFILE_PATH = "/complete-profile";

export function isProfileIncomplete(profile: UserProfile | null): boolean {
  if (!profile) return true;

  return [
    profile.fullName,
    profile.countryCode,
    profile.city,
    profile.phoneNumber,
    profile.email,
  ].some((value) => !value?.trim());
}
