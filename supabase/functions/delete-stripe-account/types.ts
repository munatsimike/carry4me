import type { ObligationBlock } from "./obligations.ts";

export type ActorProfile = {
  id: string;
  profile_type: string | null;
};

export type AuditRow = {
  id: string;
  status: "STARTED" | "SUCCEEDED" | "FAILED";
  created_at: string;
  metadata: Record<string, unknown>;
};

export type StripeDeleteOutcome =
  | "deleted"
  | "already_missing"
  | "failed"
  | "not_attempted";

export type ProfileResetOutcome =
  | "cleared"
  | "already_cleared"
  | "replaced"
  | "unchanged"
  | "error"
  | "lock_lost"
  | "skipped";

export type CarryObligationLookup =
  | {
    complete: true;
    blocker: ObligationBlock | null;
    paymentIntentIds: string[];
  }
  | { complete: false };

export type TargetConnectProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  country_code: string | null;
  country: string | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_verification_status: string;
};

export type ProfileResetResult =
  | { outcome: "cleared"; profile: TargetConnectProfile }
  | { outcome: "already_cleared"; profile: TargetConnectProfile }
  | { outcome: "replaced"; profile: TargetConnectProfile }
  | { outcome: "unchanged"; profile: TargetConnectProfile }
  | { outcome: "lock_lost" }
  | "error";

export type AdminDb = {
  loadActorProfile: (userId: string) => Promise<ActorProfile | null | "error">;
  loadTargetByStripeAccountId: (
    accountId: string,
  ) => Promise<TargetConnectProfile | null | "error">;
  loadProfileByUserId: (
    userId: string,
  ) => Promise<TargetConnectProfile | null | "error">;
  findCarryRequestObligations: (
    travelerUserId: string,
  ) => Promise<CarryObligationLookup | "error">;
  insertStartedAudit: (input: {
    actorUserId: string;
    targetUserId: string;
    stripeAccountId: string;
    metadata?: Record<string, unknown>;
  }) => Promise<AuditRow | "conflict" | "error">;
  insertFollowUpAudit: (input: {
    actorUserId: string;
    targetUserId: string;
    stripeAccountId: string;
    status: "FAILED";
    metadata: Record<string, unknown>;
  }) => Promise<boolean | "error">;
  findStartedAudit: (stripeAccountId: string) => Promise<AuditRow | null | "error">;
  lockStillOwned: (auditId: string) => Promise<boolean | "error">;
  casReleaseStartedLock: (
    auditId: string,
    metadata: Record<string, unknown>,
  ) => Promise<boolean | "error">;
  casPatchStartedMetadata: (
    auditId: string,
    metadata: Record<string, unknown>,
  ) => Promise<boolean | "error">;
  casFinishAudit: (
    auditId: string,
    status: "SUCCEEDED" | "FAILED",
    metadata: Record<string, unknown>,
  ) => Promise<boolean | "error">;
  resetTargetProfile: (
    userId: string,
    stripeAccountId: string,
    auditId: string,
  ) => Promise<ProfileResetResult>;
};
