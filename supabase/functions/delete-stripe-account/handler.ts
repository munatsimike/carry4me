import { corsHeaders } from "../_shared/cors.ts";
import { isDesignatedStripeAdmin } from "./authorize.ts";
import {
  DELETE_STRIPE_CONFIRM_PHRASE,
  RECOVER_LOCK_CONFIRM_PHRASE,
  STARTED_LOCK_TTL_MS,
} from "./constants.ts";
import type {
  AdminDb,
  AuditRow,
  ProfileResetOutcome,
  StripeDeleteOutcome,
  TargetConnectProfile,
} from "./types.ts";
import {
  checkStripeObligations,
  type StripeDeleteAdapter,
} from "./stripeAdapter.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type RequestBody = {
  stripe_account_id?: string;
  account_id?: string;
  confirm?: boolean;
  confirm_phrase?: string;
  recover_stale_lock?: boolean;
  recover_audit_id?: string;
  recover_confirm_phrase?: string;
};

export type AuthenticatedActor = {
  id: string;
};

export type DeleteStripeAccountDeps = {
  authenticate: (req: Request) => Promise<AuthenticatedActor>;
  db: AdminDb;
  stripe: StripeDeleteAdapter;
  adminAllowlist: string[];
  now?: () => number;
};

type LockClaim =
  | AuditRow
  | { conflict: true; audit: AuditRow }
  | { error: true };

function readAccountId(body: RequestBody): string | null {
  const value = body.stripe_account_id?.trim() || body.account_id?.trim();
  if (!value) return null;
  if (!value.startsWith("acct_")) return null;
  return value;
}

function isConfirmValid(body: RequestBody): boolean {
  return (
    body.confirm === true &&
    body.confirm_phrase?.trim() === DELETE_STRIPE_CONFIRM_PHRASE
  );
}

function isStaleLock(createdAt: string, now: number): boolean {
  const startedAt = Date.parse(createdAt);
  return Number.isFinite(startedAt) && now - startedAt > STARTED_LOCK_TTL_MS;
}

function isExplicitLockRecovery(body: RequestBody, audit: AuditRow): boolean {
  return (
    body.recover_stale_lock === true &&
    body.recover_audit_id?.trim() === audit.id &&
    body.recover_confirm_phrase?.trim() === RECOVER_LOCK_CONFIRM_PHRASE
  );
}

function auditMetadata(input: {
  stripeDeleted: boolean;
  profileCleared: boolean;
  stripeDeleteOutcome: StripeDeleteOutcome;
  profileResetOutcome: ProfileResetOutcome;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    stripe_deleted: input.stripeDeleted,
    profile_cleared: input.profileCleared,
    stripe_delete_outcome: input.stripeDeleteOutcome,
    profile_reset_outcome: input.profileResetOutcome,
    ...input.extra,
  };
}

async function claimStartedLock(
  db: AdminDb,
  input: {
    actorUserId: string;
    targetUserId: string;
    stripeAccountId: string;
  },
): Promise<LockClaim> {
  const inserted = await db.insertStartedAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    stripeAccountId: input.stripeAccountId,
  });

  if (inserted !== "conflict" && inserted !== "error") {
    return inserted;
  }

  if (inserted === "error") return { error: true };

  const existing = await db.findStartedAudit(input.stripeAccountId);
  if (existing === "error" || !existing) return { error: true };

  return { conflict: true, audit: existing };
}

async function requireLockOwnership(
  db: AdminDb,
  auditId: string,
): Promise<true | Response> {
  const owned = await db.lockStillOwned(auditId);
  if (owned === "error") {
    return jsonResponse(
      { error: "Could not verify deletion lock", code: "LOCK_CHECK_FAILED" },
      503,
    );
  }
  if (!owned) {
    return jsonResponse(
      {
        error: "This deletion no longer owns the account lock and was aborted.",
        code: "LOCK_LOST",
      },
      409,
    );
  }
  return true;
}

async function finishAudit(
  db: AdminDb,
  auditId: string,
  status: "SUCCEEDED" | "FAILED",
  metadata: Record<string, unknown>,
): Promise<boolean | "error"> {
  const finished = await db.casFinishAudit(auditId, status, metadata);
  if (finished === "error") {
    console.error("delete-stripe-account casFinishAudit failed", auditId, status);
  }
  return finished;
}

async function recordPartialFailure(input: {
  db: AdminDb;
  auditId: string;
  actorUserId: string;
  targetUserId: string;
  stripeAccountId: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const finished = await finishAudit(input.db, input.auditId, "FAILED", input.metadata);
  if (finished === true) return;

  await input.db.insertFollowUpAudit({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    stripeAccountId: input.stripeAccountId,
    status: "FAILED",
    metadata: {
      ...input.metadata,
      superseded_audit_id: input.auditId,
      reason: input.metadata.reason ?? "LOCK_LOST_AFTER_STRIPE_DELETE",
    },
  });
}

function successBody(
  profile: TargetConnectProfile,
  accountId: string,
  stripeDeleted: boolean,
) {
  return {
    ok: true,
    deleted: stripeDeleted,
    stripe_account_id: accountId,
    profile_cleared: true,
    verified: false,
    onboarding_complete: false,
    connect_state: "not_started",
    stripe_charges_enabled: profile.stripe_charges_enabled,
    stripe_payouts_enabled: profile.stripe_payouts_enabled,
    stripe_details_submitted: profile.stripe_details_submitted,
    stripe_verification_status: profile.stripe_verification_status ?? "not_started",
    phone_verified: profile.phone_verified,
    email_verified: profile.email_verified,
  };
}

export async function handleDeleteStripeAccount(
  req: Request,
  deps: DeleteStripeAccountDeps,
): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  let actor: AuthenticatedActor;
  try {
    actor = await deps.authenticate(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const actorProfile = await deps.db.loadActorProfile(actor.id);
  if (actorProfile === "error") {
    return jsonResponse(
      { error: "Could not verify administrator", code: "AUTHZ_CHECK_FAILED" },
      503,
    );
  }

  if (
    !isDesignatedStripeAdmin({
      userId: actor.id,
      profileType: actorProfile?.profile_type,
      allowlist: deps.adminAllowlist,
    })
  ) {
    return jsonResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  if (!isConfirmValid(body)) {
    return jsonResponse(
      {
        error: `Confirmation required. Send confirm=true and confirm_phrase="${DELETE_STRIPE_CONFIRM_PHRASE}".`,
        code: "CONFIRM_REQUIRED",
      },
      400,
    );
  }

  const accountId = readAccountId(body);
  if (!accountId) {
    return jsonResponse(
      {
        error: "stripe_account_id is required and must start with acct_",
        code: "INVALID_ACCOUNT_ID",
      },
      400,
    );
  }

  const target = await deps.db.loadTargetByStripeAccountId(accountId);
  if (target === "error") {
    return jsonResponse(
      { error: "Could not verify the Connect account", code: "LOOKUP_FAILED" },
      503,
    );
  }
  if (!target) {
    return jsonResponse(
      { error: "Account not found", code: "NOT_FOUND" },
      404,
    );
  }

  const obligations = await deps.db.findCarryRequestObligations(target.id);
  if (obligations === "error") {
    return jsonResponse(
      {
        error: "Could not verify carry-request obligations",
        code: "OBLIGATION_CHECK_FAILED",
      },
      503,
    );
  }
  if (!obligations.complete) {
    return jsonResponse(
      {
        error: "Carry-request obligation check was incomplete",
        code: "OBLIGATION_CHECK_FAILED",
      },
      503,
    );
  }
  if (obligations.blocker) {
    return jsonResponse(
      { error: obligations.blocker.message, code: obligations.blocker.code },
      409,
    );
  }

  const now = deps.now?.() ?? Date.now();
  const lock = await claimStartedLock(deps.db, {
    actorUserId: actor.id,
    targetUserId: target.id,
    stripeAccountId: accountId,
  });

  if ("error" in lock) {
    return jsonResponse(
      { error: "Could not start audited delete", code: "AUDIT_LOCK_FAILED" },
      503,
    );
  }

  if ("conflict" in lock) {
    const stale = isStaleLock(lock.audit.created_at, now);
    if (!isExplicitLockRecovery(body, lock.audit)) {
      return jsonResponse(
        {
          error: stale
            ? "A deletion lock for this account is stale. Review the audit row, then retry with recover_stale_lock=true, recover_audit_id, and recover_confirm_phrase to release it. Do not delete in the same request."
            : "A delete is already in progress for this account",
          code: stale ? "STALE_LOCK_REQUIRES_RECOVERY" : "DELETE_IN_PROGRESS",
          audit_id: lock.audit.id,
          created_at: lock.audit.created_at,
          stale,
          recover_confirm_phrase_required: RECOVER_LOCK_CONFIRM_PHRASE,
        },
        409,
      );
    }

    const released = await deps.db.casReleaseStartedLock(lock.audit.id, {
      reason: "LOCK_RECOVERED",
      recovered_by: actor.id,
      reviewed_audit_id: lock.audit.id,
      stale,
      stripe_deleted: false,
      profile_cleared: false,
      stripe_delete_outcome: "not_attempted",
      profile_reset_outcome: "skipped",
    });

    if (released === "error") {
      return jsonResponse(
        { error: "Could not release the deletion lock", code: "AUDIT_LOCK_FAILED" },
        503,
      );
    }

    if (!released) {
      return jsonResponse(
        {
          error: "A delete is already in progress for this account",
          code: "DELETE_IN_PROGRESS",
          audit_id: lock.audit.id,
        },
        409,
      );
    }

    return jsonResponse(
      {
        error:
          "Deletion lock released after administrative review. Retry the delete without recover_stale_lock.",
        code: "LOCK_RELEASED",
        audit_id: lock.audit.id,
        stale,
      },
      409,
    );
  }

  const stripeBlock = await checkStripeObligations(
    deps.stripe,
    accountId,
    obligations.paymentIntentIds,
  );

  const stripeAlreadyMissing = stripeBlock?.code === "STRIPE_ACCOUNT_MISSING";

  if (stripeBlock && !stripeAlreadyMissing) {
    const failedStatus = stripeBlock.code === "OBLIGATION_CHECK_FAILED" ? 503 : 409;
    await finishAudit(
      deps.db,
      lock.id,
      "FAILED",
      auditMetadata({
        stripeDeleted: false,
        profileCleared: false,
        stripeDeleteOutcome: "not_attempted",
        profileResetOutcome: "skipped",
        extra: { reason: stripeBlock.code, message: stripeBlock.message },
      }),
    );
    return jsonResponse(
      { error: stripeBlock.message, code: stripeBlock.code },
      failedStatus,
    );
  }

  const ownedBeforeDelete = await requireLockOwnership(deps.db, lock.id);
  if (ownedBeforeDelete !== true) return ownedBeforeDelete;

  let stripeDeleted = stripeAlreadyMissing;
  let stripeDeleteOutcome: StripeDeleteOutcome = stripeAlreadyMissing
    ? "already_missing"
    : "not_attempted";

  if (!stripeAlreadyMissing) {
    try {
      const result = await deps.stripe.deleteAccount(accountId);
      stripeDeleted = result.deleted === true || result.deleted === undefined;
      stripeDeleteOutcome = stripeDeleted ? "deleted" : "failed";
    } catch (err) {
      await finishAudit(
        deps.db,
        lock.id,
        "FAILED",
        auditMetadata({
          stripeDeleted: false,
          profileCleared: false,
          stripeDeleteOutcome: "failed",
          profileResetOutcome: "skipped",
          extra: {
            reason: "STRIPE_DELETE_FAILED",
            message: err instanceof Error ? err.message : "Stripe delete failed",
          },
        }),
      );
      return jsonResponse(
        {
          error: "Could not delete the Stripe Connect account",
          code: "STRIPE_DELETE_FAILED",
        },
        502,
      );
    }

    if (!stripeDeleted) {
      await finishAudit(
        deps.db,
        lock.id,
        "FAILED",
        auditMetadata({
          stripeDeleted: false,
          profileCleared: false,
          stripeDeleteOutcome: "failed",
          profileResetOutcome: "skipped",
          extra: { reason: "STRIPE_DELETE_FAILED" },
        }),
      );
      return jsonResponse(
        {
          error: "Could not delete the Stripe Connect account",
          code: "STRIPE_DELETE_FAILED",
        },
        502,
      );
    }
  }

  await deps.db.casPatchStartedMetadata(
    lock.id,
    auditMetadata({
      stripeDeleted: true,
      profileCleared: false,
      stripeDeleteOutcome,
      profileResetOutcome: "skipped",
      extra: { reason: "STRIPE_DELETED_PROFILE_PENDING" },
    }),
  );

  const ownedBeforeReset = await requireLockOwnership(deps.db, lock.id);
  if (ownedBeforeReset !== true) {
    await recordPartialFailure({
      db: deps.db,
      auditId: lock.id,
      actorUserId: actor.id,
      targetUserId: target.id,
      stripeAccountId: accountId,
      metadata: auditMetadata({
        stripeDeleted: true,
        profileCleared: false,
        stripeDeleteOutcome,
        profileResetOutcome: "lock_lost",
        extra: { reason: "LOCK_LOST" },
      }),
    });
    return ownedBeforeReset;
  }

  const refreshed = await deps.db.resetTargetProfile(target.id, accountId, lock.id);
  if (refreshed === "error") {
    await recordPartialFailure({
      db: deps.db,
      auditId: lock.id,
      actorUserId: actor.id,
      targetUserId: target.id,
      stripeAccountId: accountId,
      metadata: auditMetadata({
        stripeDeleted,
        profileCleared: false,
        stripeDeleteOutcome,
        profileResetOutcome: "error",
        extra: { reason: "PROFILE_RESET_FAILED", resume_profile_reset: true },
      }),
    });
    return jsonResponse(
      {
        ok: false,
        deleted: stripeDeleted,
        stripe_account_id: accountId,
        profile_cleared: false,
        error:
          "Stripe account was removed but the Carry4Me profile could not be reset. Retry to finish cleanup.",
        code: "PROFILE_RESET_FAILED",
      },
      500,
    );
  }

  if (refreshed.outcome === "lock_lost") {
    await recordPartialFailure({
      db: deps.db,
      auditId: lock.id,
      actorUserId: actor.id,
      targetUserId: target.id,
      stripeAccountId: accountId,
      metadata: auditMetadata({
        stripeDeleted,
        profileCleared: false,
        stripeDeleteOutcome,
        profileResetOutcome: "lock_lost",
        extra: { reason: "LOCK_LOST" },
      }),
    });
    return jsonResponse(
      {
        error: "This deletion no longer owns the account lock and was aborted.",
        code: "LOCK_LOST",
        deleted: stripeDeleted,
        profile_cleared: false,
      },
      409,
    );
  }

  if (refreshed.outcome === "replaced") {
    await recordPartialFailure({
      db: deps.db,
      auditId: lock.id,
      actorUserId: actor.id,
      targetUserId: target.id,
      stripeAccountId: accountId,
      metadata: auditMetadata({
        stripeDeleted,
        profileCleared: false,
        stripeDeleteOutcome,
        profileResetOutcome: "replaced",
        extra: {
          reason: "ACCOUNT_REPLACED",
          current_stripe_account_id: refreshed.profile.stripe_account_id,
        },
      }),
    });
    return jsonResponse(
      {
        ok: false,
        deleted: stripeDeleted,
        stripe_account_id: accountId,
        profile_cleared: false,
        error:
          "A newer Stripe Connect account is linked to this profile. The original account was not cleared from the profile.",
        code: "ACCOUNT_REPLACED",
      },
      409,
    );
  }

  if (refreshed.outcome === "unchanged") {
    await recordPartialFailure({
      db: deps.db,
      auditId: lock.id,
      actorUserId: actor.id,
      targetUserId: target.id,
      stripeAccountId: accountId,
      metadata: auditMetadata({
        stripeDeleted,
        profileCleared: false,
        stripeDeleteOutcome,
        profileResetOutcome: "unchanged",
        extra: { reason: "PROFILE_RESET_FAILED", resume_profile_reset: true },
      }),
    });
    return jsonResponse(
      {
        ok: false,
        deleted: stripeDeleted,
        stripe_account_id: accountId,
        profile_cleared: false,
        error:
          "Stripe account was removed but the Carry4Me profile could not be reset. Retry to finish cleanup.",
        code: "PROFILE_RESET_FAILED",
      },
      500,
    );
  }

  const succeeded = await finishAudit(
    deps.db,
    lock.id,
    "SUCCEEDED",
    auditMetadata({
      stripeDeleted: true,
      profileCleared: true,
      stripeDeleteOutcome,
      profileResetOutcome: refreshed.outcome,
      extra: { stripe_already_missing: stripeAlreadyMissing },
    }),
  );

  if (succeeded !== true) {
    return jsonResponse(
      {
        ok: false,
        deleted: stripeDeleted,
        stripe_account_id: accountId,
        profile_cleared: true,
        error: "Profile was reset but the audit record could not be finished.",
        code: "AUDIT_FINISH_FAILED",
      },
      500,
    );
  }

  return jsonResponse(successBody(refreshed.profile, accountId, stripeDeleted));
}
