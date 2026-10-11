import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DELETE_STRIPE_CONFIRM_PHRASE,
  RECOVER_LOCK_CONFIRM_PHRASE,
  STARTED_LOCK_TTL_MS,
} from "./constants.ts";
import type { AdminDb, AuditRow, CarryObligationLookup, ProfileResetResult } from "./types.ts";
import { handleDeleteStripeAccount } from "./handler.ts";
import type { StripeDeleteAdapter } from "./stripeAdapter.ts";

type TargetProfile = {
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

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const TARGET_ID = "22222222-2222-2222-2222-222222222222";
const ACCOUNT_ID = "acct_test_123";
const NEW_ACCOUNT_ID = "acct_new_456";

function targetProfile(
  overrides: Partial<TargetProfile> = {},
): TargetProfile {
  return {
    id: TARGET_ID,
    email: "traveler@example.com",
    full_name: "Test Traveler",
    phone_verified: true,
    email_verified: true,
    country_code: "NL",
    country: "Netherlands",
    stripe_account_id: ACCOUNT_ID,
    stripe_charges_enabled: true,
    stripe_payouts_enabled: true,
    stripe_details_submitted: true,
    stripe_verification_status: "verified",
    ...overrides,
  };
}

function clearedProfile(): TargetProfile {
  return targetProfile({
    stripe_account_id: null,
    stripe_charges_enabled: false,
    stripe_payouts_enabled: false,
    stripe_details_submitted: false,
    stripe_verification_status: "not_started",
  });
}

function clearedReset(): ProfileResetResult {
  return { outcome: "cleared", profile: clearedProfile() };
}

function startedAudit(overrides: Partial<AuditRow> = {}): AuditRow {
  return {
    id: "audit-1",
    status: "STARTED",
    created_at: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function noObligations(
  overrides: Partial<Extract<CarryObligationLookup, { complete: true }>> = {},
): CarryObligationLookup {
  return {
    complete: true,
    blocker: null,
    paymentIntentIds: [],
    ...overrides,
  };
}

function createDb(overrides: Partial<AdminDb> = {}): AdminDb {
  return {
    loadActorProfile: async () => ({ id: ADMIN_ID, profile_type: "admin" }),
    loadTargetByStripeAccountId: async () => targetProfile(),
    loadProfileByUserId: async () => targetProfile(),
    findCarryRequestObligations: async () => noObligations(),
    insertStartedAudit: async () => startedAudit(),
    insertFollowUpAudit: async () => true,
    findStartedAudit: async () => null,
    lockStillOwned: async () => true,
    casReleaseStartedLock: async () => true,
    casPatchStartedMetadata: async () => true,
    casFinishAudit: async () => true,
    resetTargetProfile: async () => clearedReset(),
    ...overrides,
  };
}

function emptyPage<T>(items: T[] = []) {
  return { items, complete: true as const };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function createStripe(
  overrides: Partial<StripeDeleteAdapter> & { deletedIds?: string[] } = {},
): StripeDeleteAdapter {
  const deletedIds = overrides.deletedIds ?? [];
  return {
    retrieveAccount: async () => ({ id: ACCOUNT_ID }),
    getBalance: async () => ({ available: [], pending: [], connect_reserved: [] }),
    listPayouts: async () => emptyPage(),
    listTransfers: async () => emptyPage(),
    listRefunds: async () => emptyPage(),
    deleteAccount: async (accountId) => {
      deletedIds.push(accountId);
      return { deleted: true };
    },
    ...overrides,
  };
}

async function invoke(
  body: Record<string, unknown>,
  deps: Parameters<typeof handleDeleteStripeAccount>[1],
): Promise<{ status: number; json: Record<string, unknown> }> {
  const response = await handleDeleteStripeAccount(
    new Request("http://localhost/functions/v1/delete-stripe-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    deps,
  );
  return { status: response.status, json: await response.json() };
}

function adminDeps(overrides: {
  db?: Partial<AdminDb>;
  stripe?: Partial<StripeDeleteAdapter> & { deletedIds?: string[] };
  authenticate?: () => Promise<{ id: string }>;
  adminAllowlist?: string[];
  now?: () => number;
} = {}) {
  return {
    authenticate: overrides.authenticate ?? (async () => ({ id: ADMIN_ID })),
    db: createDb(overrides.db),
    stripe: createStripe(overrides.stripe),
    adminAllowlist: overrides.adminAllowlist ?? [ADMIN_ID],
    now: overrides.now,
  };
}

const validBody = {
  stripe_account_id: ACCOUNT_ID,
  confirm: true,
  confirm_phrase: DELETE_STRIPE_CONFIRM_PHRASE,
};

Deno.test("unauthenticated caller receives 401 and Stripe is not called", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(validBody, {
    ...adminDeps({ stripe: { deletedIds } }),
    authenticate: async () => {
      throw new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    },
  });
  assertEquals(result.status, 401);
  assertEquals(deletedIds.length, 0);
});

Deno.test("ordinary authenticated user receives 403", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(validBody, adminDeps({
    stripe: { deletedIds },
    authenticate: async () => ({ id: TARGET_ID }),
    db: {
      loadActorProfile: async () => ({ id: TARGET_ID, profile_type: "ordinary" }),
    },
    adminAllowlist: [ADMIN_ID],
  }));
  assertEquals(result.status, 403);
  assertEquals(result.json.code, "FORBIDDEN");
  assertEquals(deletedIds.length, 0);
});

Deno.test("admin missing from STRIPE_CONNECT_ADMIN_USER_IDS receives 403", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      adminAllowlist: ["99999999-9999-9999-9999-999999999999"],
    }),
  );
  assertEquals(result.status, 403);
  assertEquals(deletedIds.length, 0);
});

Deno.test("empty allowlist fails closed even for profile_type=admin", async () => {
  const result = await invoke(validBody, adminDeps({ adminAllowlist: [] }));
  assertEquals(result.status, 403);
});

Deno.test("missing confirmation is rejected", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    { stripe_account_id: ACCOUNT_ID },
    adminDeps({ stripe: { deletedIds } }),
  );
  assertEquals(result.status, 400);
  assertEquals(result.json.code, "CONFIRM_REQUIRED");
  assertEquals(deletedIds.length, 0);
});

Deno.test("invalid Stripe account id is rejected", async () => {
  const result = await invoke(
    {
      stripe_account_id: "cus_not_an_account",
      confirm: true,
      confirm_phrase: DELETE_STRIPE_CONFIRM_PHRASE,
    },
    adminDeps(),
  );
  assertEquals(result.status, 400);
  assertEquals(result.json.code, "INVALID_ACCOUNT_ID");
});

Deno.test("account id not in Carry4Me database is 404 and Stripe is not deleted", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: { loadTargetByStripeAccountId: async () => null },
    }),
  );
  assertEquals(result.status, 404);
  assertEquals(result.json.code, "NOT_FOUND");
  assertEquals(deletedIds.length, 0);
});

Deno.test("database obligation lookup failure fails closed", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: { findCarryRequestObligations: async () => "error" },
    }),
  );
  assertEquals(result.status, 503);
  assertEquals(result.json.code, "OBLIGATION_CHECK_FAILED");
  assertEquals(deletedIds.length, 0);
});

Deno.test("incomplete carry-request obligation results fail closed", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: { findCarryRequestObligations: async () => ({ complete: false }) },
    }),
  );
  assertEquals(result.status, 503);
  assertEquals(result.json.code, "OBLIGATION_CHECK_FAILED");
  assertEquals(deletedIds.length, 0);
});

Deno.test("active carry request blocks deletion", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        findCarryRequestObligations: async () =>
          noObligations({
            blocker: {
              code: "ACTIVE_CARRY_REQUEST",
              message: "This traveler still has an active carry request.",
            },
          }),
      },
    }),
  );
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "ACTIVE_CARRY_REQUEST");
  assertEquals(deletedIds.length, 0);
});

Deno.test("pending refund blocks deletion", async () => {
  const result = await invoke(
    validBody,
    adminDeps({
      db: {
        findCarryRequestObligations: async () =>
          noObligations({
            blocker: {
              code: "PENDING_REFUND",
              message: "A refund is still pending on a request for this traveler.",
            },
          }),
      },
    }),
  );
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "PENDING_REFUND");
});

Deno.test("unresolved dispute blocks deletion", async () => {
  const result = await invoke(
    validBody,
    adminDeps({
      db: {
        findCarryRequestObligations: async () =>
          noObligations({
            blocker: {
              code: "UNRESOLVED_DISPUTE",
              message: "This traveler has an unresolved payment dispute.",
            },
          }),
      },
    }),
  );
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "UNRESOLVED_DISPUTE");
});

Deno.test("large carry-request histories still surface a blocking obligation", async () => {
  const deletedIds: string[] = [];
  const paymentIntentIds = Array.from({ length: 5000 }, (_, index) => `pi_${index}`);
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        findCarryRequestObligations: async () =>
          noObligations({
            paymentIntentIds,
            blocker: {
              code: "ACTIVE_CARRY_REQUEST",
              message: "This traveler still has an active carry request.",
            },
          }),
      },
    }),
  );
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "ACTIVE_CARRY_REQUEST");
  assertEquals(deletedIds.length, 0);
});

Deno.test("large carry-request histories pass every payment intent to Stripe refund checks", async () => {
  const paymentIntentIds = Array.from({ length: 2500 }, (_, index) => `pi_${index}`);
  let refundQuery: string[] | null = null;
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        listRefunds: async (ids) => {
          refundQuery = ids;
          return emptyPage();
        },
      },
      db: {
        findCarryRequestObligations: async () => noObligations({ paymentIntentIds }),
      },
    }),
  );
  assertEquals(result.status, 200);
  const queried = refundQuery ?? [];
  assertEquals(queried.length, 2500);
  assertEquals(queried[0], "pi_0");
  assertEquals(queried[2499], "pi_2499");
});

Deno.test("concurrent STARTED lock is rejected and Stripe is not deleted", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        insertStartedAudit: async () => "conflict",
        findStartedAudit: async () => startedAudit(),
      },
    }),
  );
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "DELETE_IN_PROGRESS");
  assertEquals(deletedIds.length, 0);
});

Deno.test("in-flight STARTED lock rejects a second concurrent request", async () => {
  const deletedIds: string[] = [];
  let started: AuditRow | null = null;

  const sharedDb: Partial<AdminDb> = {
    insertStartedAudit: async () => {
      if (started?.status === "STARTED") return "conflict";
      started = startedAudit();
      return started;
    },
    findStartedAudit: async () => (started?.status === "STARTED" ? started : null),
    lockStillOwned: async (auditId) =>
      started?.id === auditId && started.status === "STARTED",
    casFinishAudit: async () => true,
  };

  const firstStarted = deferred();
  const releaseFirst = deferred();

  const first = invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        listPayouts: async () => {
          firstStarted.resolve();
          await releaseFirst.promise;
          return emptyPage();
        },
      },
      db: sharedDb,
    }),
  );

  await firstStarted.promise;
  const second = await invoke(
    validBody,
    adminDeps({ stripe: { deletedIds }, db: sharedDb }),
  );
  releaseFirst.resolve();
  const firstResult = await first;

  assertEquals(second.status, 409);
  assertEquals(second.json.code, "DELETE_IN_PROGRESS");
  assertEquals(firstResult.status, 200);
  assertEquals(deletedIds, [ACCOUNT_ID]);
});

Deno.test("stale lock is not taken over automatically", async () => {
  const deletedIds: string[] = [];
  let released = false;
  const stale = startedAudit({
    created_at: new Date(Date.now() - STARTED_LOCK_TTL_MS - 1).toISOString(),
  });

  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        insertStartedAudit: async () => "conflict",
        findStartedAudit: async () => stale,
        casReleaseStartedLock: async () => {
          released = true;
          return true;
        },
      },
      now: () => Date.now(),
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "STALE_LOCK_REQUIRES_RECOVERY");
  assertEquals(result.json.audit_id, stale.id);
  assertEquals(released, false);
  assertEquals(deletedIds.length, 0);
});

Deno.test("timeout flag alone cannot recover a stale lock", async () => {
  const deletedIds: string[] = [];
  let released = false;
  const stale = startedAudit({
    created_at: new Date(Date.now() - STARTED_LOCK_TTL_MS - 1).toISOString(),
  });

  const result = await invoke(
    { ...validBody, recover_stale_lock: true },
    adminDeps({
      stripe: { deletedIds },
      db: {
        insertStartedAudit: async () => "conflict",
        findStartedAudit: async () => stale,
        casReleaseStartedLock: async () => {
          released = true;
          return true;
        },
      },
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "STALE_LOCK_REQUIRES_RECOVERY");
  assertEquals(released, false);
  assertEquals(deletedIds.length, 0);
});

Deno.test("explicit reviewed lock recovery requires matching audit id and confirm phrase", async () => {
  const deletedIds: string[] = [];
  const releasedIds: string[] = [];
  const stale = startedAudit({
    created_at: new Date(Date.now() - STARTED_LOCK_TTL_MS - 1).toISOString(),
  });

  const result = await invoke(
    {
      ...validBody,
      recover_stale_lock: true,
      recover_audit_id: stale.id,
      recover_confirm_phrase: RECOVER_LOCK_CONFIRM_PHRASE,
    },
    adminDeps({
      stripe: { deletedIds },
      db: {
        insertStartedAudit: async () => "conflict",
        findStartedAudit: async () => stale,
        casReleaseStartedLock: async (auditId, metadata) => {
          releasedIds.push(auditId);
          assertEquals(metadata["reason"], "LOCK_RECOVERED");
          assertEquals(metadata["stripe_deleted"], false);
          assertEquals(metadata["profile_cleared"], false);
          return true;
        },
      },
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "LOCK_RELEASED");
  assertEquals(releasedIds, [stale.id]);
  assertEquals(deletedIds.length, 0);
});

Deno.test("wrong recover_audit_id does not release the lock", async () => {
  const deletedIds: string[] = [];
  let released = false;
  const stale = startedAudit({
    created_at: new Date(Date.now() - STARTED_LOCK_TTL_MS - 1).toISOString(),
  });

  const result = await invoke(
    {
      ...validBody,
      recover_stale_lock: true,
      recover_audit_id: "audit-other",
      recover_confirm_phrase: RECOVER_LOCK_CONFIRM_PHRASE,
    },
    adminDeps({
      stripe: { deletedIds },
      db: {
        insertStartedAudit: async () => "conflict",
        findStartedAudit: async () => stale,
        casReleaseStartedLock: async () => {
          released = true;
          return true;
        },
      },
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "STALE_LOCK_REQUIRES_RECOVERY");
  assertEquals(released, false);
  assertEquals(deletedIds.length, 0);
});

Deno.test("an operation that lost its lock does not delete Stripe or reset the profile", async () => {
  const deletedIds: string[] = [];
  let resetCalled = false;

  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        lockStillOwned: async () => false,
        resetTargetProfile: async () => {
          resetCalled = true;
          return clearedReset();
        },
      },
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "LOCK_LOST");
  assertEquals(deletedIds.length, 0);
  assertEquals(resetCalled, false);
});

Deno.test("lost lock after Stripe delete does not reset the profile", async () => {
  const deletedIds: string[] = [];
  let lockChecks = 0;
  let resetCalled = false;

  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        lockStillOwned: async () => {
          lockChecks += 1;
          return lockChecks === 1;
        },
        resetTargetProfile: async () => {
          resetCalled = true;
          return clearedReset();
        },
      },
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "LOCK_LOST");
  assertEquals(deletedIds, [ACCOUNT_ID]);
  assertEquals(resetCalled, false);
});

Deno.test("Stripe obligation check failure fails closed", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        getBalance: async () => {
          throw new Error("stripe down");
        },
      },
    }),
  );
  assertEquals(result.status, 503);
  assertEquals(result.json.code, "OBLIGATION_CHECK_FAILED");
  assertEquals(deletedIds.length, 0);
});

Deno.test("malformed Stripe balance fails closed instead of treating it as zero", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        getBalance: async () => ({ pending: [{ amount: 0 }] }),
      },
    }),
  );
  assertEquals(result.status, 503);
  assertEquals(result.json.code, "OBLIGATION_CHECK_FAILED");
  assertEquals(deletedIds.length, 0);
});

Deno.test("outstanding Stripe balance blocks deletion", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        getBalance: async () => ({
          available: [],
          pending: [{ amount: 1200 }],
        }),
      },
    }),
  );
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "STRIPE_BALANCE_OUTSTANDING");
  assertEquals(deletedIds.length, 0);
});

Deno.test("completed Stripe transfers and refunds do not block deletion", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        listTransfers: async () =>
          emptyPage([{ reversed: false, amount: 1800, amount_reversed: 0 }]),
        listRefunds: async () => emptyPage([{ status: "succeeded" }]),
        listPayouts: async () => emptyPage([{ status: "paid" }]),
      },
    }),
  );
  assertEquals(result.status, 200);
  assertEquals(result.json.ok, true);
  assertEquals(deletedIds, [ACCOUNT_ID]);
});

Deno.test("incomplete Stripe payout pages fail closed", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        listPayouts: async () => ({ items: [{ status: "paid" }], complete: false }),
      },
    }),
  );
  assertEquals(result.status, 503);
  assertEquals(result.json.code, "OBLIGATION_CHECK_FAILED");
  assertEquals(deletedIds.length, 0);
});

Deno.test("incomplete Stripe transfer pages fail closed", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        listTransfers: async () => ({
          items: [{ amount: 100, amount_reversed: 0 }],
          complete: false,
        }),
      },
    }),
  );
  assertEquals(result.status, 503);
  assertEquals(deletedIds.length, 0);
});

Deno.test("incomplete Stripe refund pages fail closed", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        listRefunds: async () => ({
          items: [{ status: "succeeded" }],
          complete: false,
        }),
      },
    }),
  );
  assertEquals(result.status, 503);
  assertEquals(result.json.code, "OBLIGATION_CHECK_FAILED");
  assertEquals(deletedIds.length, 0);
});

Deno.test("authorized admin happy path uses mocked Stripe delete", async () => {
  const deletedIds: string[] = [];
  const statuses: string[] = [];
  let succeededMeta: Record<string, unknown> | null = null;
  const resetArgs: Array<[string, string, string]> = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        casFinishAudit: async (_id, status, metadata) => {
          statuses.push(status);
          if (status === "SUCCEEDED") succeededMeta = metadata;
          return true;
        },
        resetTargetProfile: async (userId, stripeAccountId, auditId) => {
          resetArgs.push([userId, stripeAccountId, auditId]);
          return clearedReset();
        },
      },
    }),
  );
  assertEquals(result.status, 200);
  assertEquals(result.json.ok, true);
  assertEquals(result.json.deleted, true);
  assertEquals(result.json.profile_cleared, true);
  assertEquals(deletedIds, [ACCOUNT_ID]);
  assertEquals(statuses, ["SUCCEEDED"]);
  assertEquals(resetArgs, [[TARGET_ID, ACCOUNT_ID, "audit-1"]]);
  assertEquals(succeededMeta && succeededMeta["stripe_deleted"], true);
  assertEquals(succeededMeta && succeededMeta["profile_cleared"], true);
  assertEquals(succeededMeta && succeededMeta["stripe_delete_outcome"], "deleted");
  assertEquals(succeededMeta && succeededMeta["profile_reset_outcome"], "cleared");
});

Deno.test("Stripe already missing skips delete and resets the profile", async () => {
  const deletedIds: string[] = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: {
        deletedIds,
        retrieveAccount: async () => "missing",
      },
    }),
  );
  assertEquals(result.status, 200);
  assertEquals(result.json.ok, true);
  assertEquals(deletedIds.length, 0);
  assertEquals(result.json.profile_cleared, true);
});

Deno.test("already-cleared profile after zero-row update is treated as success", async () => {
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { retrieveAccount: async () => "missing" },
      db: {
        resetTargetProfile: async () => ({
          outcome: "already_cleared",
          profile: clearedProfile(),
        }),
      },
    }),
  );
  assertEquals(result.status, 200);
  assertEquals(result.json.ok, true);
  assertEquals(result.json.profile_cleared, true);
});

Deno.test("newly linked Stripe account is not erased by profile cleanup", async () => {
  const deletedIds: string[] = [];
  const resetArgs: Array<[string, string]> = [];
  let failedMeta: Record<string, unknown> | null = null;

  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        resetTargetProfile: async (userId, stripeAccountId) => {
          resetArgs.push([userId, stripeAccountId]);
          return {
            outcome: "replaced",
            profile: targetProfile({ stripe_account_id: NEW_ACCOUNT_ID }),
          };
        },
        casFinishAudit: async (_id, status, metadata) => {
          if (status === "FAILED") failedMeta = metadata;
          return true;
        },
      },
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "ACCOUNT_REPLACED");
  assertEquals(result.json.profile_cleared, false);
  assertEquals(resetArgs, [[TARGET_ID, ACCOUNT_ID]]);
  assertEquals(deletedIds, [ACCOUNT_ID]);
  assertEquals(failedMeta && failedMeta["current_stripe_account_id"], NEW_ACCOUNT_ID);
  assertEquals(failedMeta && failedMeta["stripe_deleted"], true);
  assertEquals(failedMeta && failedMeta["profile_cleared"], false);
  assertEquals(failedMeta && failedMeta["profile_reset_outcome"], "replaced");
});

Deno.test("retry after profile reset failure still targets the original account id", async () => {
  const resetArgs: Array<[string, string]> = [];
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { retrieveAccount: async () => "missing" },
      db: {
        resetTargetProfile: async (userId, stripeAccountId) => {
          resetArgs.push([userId, stripeAccountId]);
          return {
            outcome: "replaced",
            profile: targetProfile({ stripe_account_id: NEW_ACCOUNT_ID }),
          };
        },
      },
    }),
  );
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "ACCOUNT_REPLACED");
  assertEquals(resetArgs, [[TARGET_ID, ACCOUNT_ID]]);
});

Deno.test("Stripe delete success with profile reset failure is audited FAILED", async () => {
  const deletedIds: string[] = [];
  let failedMeta: Record<string, unknown> | null = null;
  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        resetTargetProfile: async () => "error",
        casFinishAudit: async (_id, status, metadata) => {
          if (status === "FAILED") failedMeta = metadata;
          return true;
        },
      },
    }),
  );
  assertEquals(result.status, 500);
  assertEquals(result.json.code, "PROFILE_RESET_FAILED");
  assertEquals(deletedIds, [ACCOUNT_ID]);
  assertEquals(failedMeta && failedMeta["stripe_deleted"], true);
  assertEquals(failedMeta && failedMeta["profile_cleared"], false);
  assertEquals(failedMeta && failedMeta["stripe_delete_outcome"], "deleted");
  assertEquals(failedMeta && failedMeta["profile_reset_outcome"], "error");
  assertEquals(failedMeta && failedMeta["resume_profile_reset"], true);
});

Deno.test("zero-row update that still shows the original account fails closed", async () => {
  const result = await invoke(
    validBody,
    adminDeps({
      db: {
        resetTargetProfile: async () => ({
          outcome: "unchanged",
          profile: targetProfile(),
        }),
      },
    }),
  );
  assertEquals(result.status, 500);
  assertEquals(result.json.code, "PROFILE_RESET_FAILED");
});

Deno.test("an older operation cannot reset the profile after a newer lock is claimed", async () => {
  const deletedIds: string[] = [];
  let resetAuditId: string | null = null;
  let failedMeta: Record<string, unknown> | null = null;

  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        lockStillOwned: async () => true,
        resetTargetProfile: async (_userId, _accountId, auditId) => {
          resetAuditId = auditId;
          return { outcome: "lock_lost" };
        },
        casFinishAudit: async (_id, status, metadata) => {
          if (status === "FAILED") failedMeta = metadata;
          return true;
        },
      },
    }),
  );

  assertEquals(result.status, 409);
  assertEquals(result.json.code, "LOCK_LOST");
  assertEquals(result.json.profile_cleared, false);
  assertEquals(resetAuditId, "audit-1");
  assertEquals(deletedIds, [ACCOUNT_ID]);
  assertEquals(failedMeta && failedMeta["stripe_deleted"], true);
  assertEquals(failedMeta && failedMeta["profile_cleared"], false);
  assertEquals(failedMeta && failedMeta["profile_reset_outcome"], "lock_lost");
});

Deno.test("overlapping recover then newer delete: old reset is rejected", async () => {
  const deletedIds: string[] = [];
  let currentOwner = "audit-1";
  let resetCalled = false;

  const result = await invoke(
    validBody,
    adminDeps({
      stripe: { deletedIds },
      db: {
        insertStartedAudit: async () => startedAudit({ id: "audit-1" }),
        lockStillOwned: async (auditId) => auditId === currentOwner,
        resetTargetProfile: async (_userId, _accountId, auditId) => {
          currentOwner = "audit-2";
          resetCalled = true;
          if (auditId !== currentOwner) return { outcome: "lock_lost" };
          return clearedReset();
        },
      },
    }),
  );

  assertEquals(resetCalled, true);
  assertEquals(result.status, 409);
  assertEquals(result.json.code, "LOCK_LOST");
  assertEquals(result.json.profile_cleared, false);
  assertEquals(deletedIds, [ACCOUNT_ID]);
});
