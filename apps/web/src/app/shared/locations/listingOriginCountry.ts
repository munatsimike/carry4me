import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";
import { isAdminProfile } from "@/app/shared/Authentication/domain/profileType";
import { getProfileOriginCountryCode } from "./profileDestinationDefaults";

export function shouldLockListingOriginCountry(
  profile: UserProfile | null | undefined,
): boolean {
  return !isAdminProfile(profile);
}

export function applyLockedListingOriginCountry<
  T extends { originCountry: string },
>(values: T, profile: UserProfile | null | undefined): T {
  if (isAdminProfile(profile)) return values;

  const locked = getProfileOriginCountryCode(profile);
  if (!locked || values.originCountry === locked) return values;

  return { ...values, originCountry: locked };
}
