export const ACCOUNT_STATUSES = {
  ACTIVE: "active",
  PENDING_REVIEW: "pending_review",
  SUSPENDED: "suspended",
} as const;

export type AccountStatus =
  (typeof ACCOUNT_STATUSES)[keyof typeof ACCOUNT_STATUSES];

export type RestrictedAccountAction = "post_listing" | "send_request";

type AccountStatusProfile = { accountStatus?: AccountStatus } | null;

export function isPendingReview(profile: AccountStatusProfile): boolean {
  return profile?.accountStatus === ACCOUNT_STATUSES.PENDING_REVIEW;
}

export function isSuspended(profile: AccountStatusProfile): boolean {
  return profile?.accountStatus === ACCOUNT_STATUSES.SUSPENDED;
}

export function getDefaultAuthedPath(profile: AccountStatusProfile): string {
  return isSuspended(profile) ? "/" : "/dashboard";
}

export function getAccountActionBlockReason(
  profile: AccountStatusProfile,
  action: RestrictedAccountAction,
): string | null {
  if (isSuspended(profile)) {
    return "Your account is suspended. You can browse listings, but account actions are paused.";
  }

  if (!isPendingReview(profile)) {
    return null;
  }

  if (action === "send_request") {
    return "Your account is under review. You can browse listings, but sending requests is paused.";
  }

  return "Your account is under review. You can browse listings, but posting is paused.";
}
