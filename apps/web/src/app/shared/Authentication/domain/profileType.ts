export const PROFILE_TYPES = {
  ORDINARY: "ordinary",
  ADMIN: "admin",
} as const;

export type ProfileType = (typeof PROFILE_TYPES)[keyof typeof PROFILE_TYPES];

export function toProfileType(value: string | null | undefined): ProfileType {
  if (value === PROFILE_TYPES.ADMIN) {
    return PROFILE_TYPES.ADMIN;
  }

  return PROFILE_TYPES.ORDINARY;
}

export function formatProfileTypeLabel(profileType: ProfileType): string {
  if (profileType === PROFILE_TYPES.ADMIN) {
    return "Admin";
  }

  return "Ordinary";
}

export function isAdminProfile(
  profile: { profileType?: ProfileType } | null | undefined,
): boolean {
  return profile?.profileType === PROFILE_TYPES.ADMIN;
}
