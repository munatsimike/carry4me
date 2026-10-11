import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  EMAIL_QUEUE_LEASE_SECONDS,
  EMAIL_QUEUE_MAX_ATTEMPTS,
  InMemoryEmailQueue,
  OTP_SUPERSEDED_ERROR,
  applyClaim,
  canClaimEmailQueueRow,
  canFinishClaimedRow,
  deliveryOtpInAppBody,
  isSecretAbandoned,
  nextAttemptDelaySeconds,
  resendIdempotencyKey,
  shouldDeleteOtpSecret,
  shouldSendAfterPreSendCheck,
} from "../functions/_shared/emailQueueClaim.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pendingRow(id = "q1") {
  return {
    id,
    notification_id: "n1",
    user_id: "u1",
    status: "pending",
    attempts: 0,
    last_error: null,
    lease_token: null,
    lease_expires_at: null,
    next_attempt_at: new Date(0).toISOString(),
  };
}

async function simulatedWorker(queue, id, token, nowMs, provider) {
  const claimed = queue.claim(id, token, nowMs);
  if (!claimed) {
    return { sent: false, reason: "not_claimed" };
  }
  const outcome = await provider();
  if (outcome.crash) {
    return { sent: false, reason: "crashed" };
  }
  if (outcome.timeout) {
    queue.finishFailed(id, token, "provider_timeout", nowMs);
    return { sent: false, reason: "timeout" };
  }
  if (!outcome.ok) {
    queue.finishFailed(id, token, outcome.error ?? "provider_error", nowMs);
    return { sent: false, reason: "provider_error" };
  }
  const leaseStillHeld = canFinishClaimedRow(queue.get(id), token);
  if (
    !shouldSendAfterPreSendCheck({
      leaseStillHeld,
      superseded: queue.get(id)?.last_error === OTP_SUPERSEDED_ERROR,
      secretPresent: true,
      notificationType: "DELIVERY_OTP",
    })
  ) {
    return { sent: false, reason: "pre_send_abort" };
  }
  if (!queue.finishSent(id, token)) {
    return { sent: false, reason: "lease_lost_after_provider" };
  }
  return { sent: true };
}

test("two concurrent workers cannot both claim the same queue row", async () => {
  const queue = new InMemoryEmailQueue(new Map([["q1", pendingRow()]]));
  const now = Date.now();
  const [a, b] = await Promise.all([
    simulatedWorker(queue, "q1", "lease-a", now, async () => ({ ok: true })),
    simulatedWorker(queue, "q1", "lease-b", now, async () => ({ ok: true })),
  ]);
  const wins = [a, b].filter((result) => result.sent);
  const losses = [a, b].filter((result) => result.reason === "not_claimed");
  assert.equal(wins.length, 1);
  assert.equal(losses.length, 1);
  assert.equal(queue.get("q1")?.status, "sent");
});

test("resend supersede blocks in-flight finish after provider accept", () => {
  const queue = new InMemoryEmailQueue(new Map([["q1", pendingRow()]]));
  const now = Date.now();
  assert.ok(queue.claim("q1", "lease-a", now));
  queue.supersede("q1");
  assert.equal(
    shouldSendAfterPreSendCheck({
      leaseStillHeld: canFinishClaimedRow(queue.get("q1"), "lease-a"),
      superseded: true,
      secretPresent: true,
      notificationType: "DELIVERY_OTP",
    }),
    false,
  );
  assert.equal(queue.finishSent("q1", "lease-a"), false);
  assert.equal(queue.get("q1")?.last_error, OTP_SUPERSEDED_ERROR);
  assert.equal(
    shouldDeleteOtpSecret({
      finishWon: false,
      terminal: true,
      notificationType: "DELIVERY_OTP",
    }),
    true,
  );
});

test("provider timeout records a retryable failure instead of sent", async () => {
  const queue = new InMemoryEmailQueue(new Map([["q1", pendingRow()]]));
  const now = Date.now();
  const result = await simulatedWorker(
    queue,
    "q1",
    "lease-a",
    now,
    async () => ({ timeout: true }),
  );
  assert.equal(result.sent, false);
  assert.equal(result.reason, "timeout");
  assert.equal(queue.get("q1")?.status, "failed");
  assert.equal(queue.get("q1")?.attempts, 1);
  assert.ok(Date.parse(queue.get("q1").next_attempt_at) > now);
});

test("worker crash leaves a reclaimable lease for a second worker", async () => {
  const queue = new InMemoryEmailQueue(new Map([["q1", pendingRow()]]));
  const now = Date.now();
  const crashed = await simulatedWorker(
    queue,
    "q1",
    "lease-a",
    now,
    async () => ({ crash: true }),
  );
  assert.equal(crashed.reason, "crashed");
  assert.equal(queue.get("q1")?.status, "processing");
  assert.equal(
    canClaimEmailQueueRow(queue.get("q1"), now + 1_000),
    false,
  );

  queue.expireLease("q1", now);
  const retry = await simulatedWorker(
    queue,
    "q1",
    "lease-b",
    now + 1,
    async () => ({ ok: true }),
  );
  assert.equal(retry.sent, true);
  assert.equal(queue.get("q1")?.status, "sent");
});

test("stale lease is reclaimable and live lease is not", () => {
  const now = Date.now();
  const live = applyClaim(pendingRow(), "t1", now);
  assert.equal(canClaimEmailQueueRow(live, now + 1_000), false);
  assert.equal(
    canClaimEmailQueueRow(live, now + EMAIL_QUEUE_LEASE_SECONDS * 1000 + 1),
    true,
  );
});

test("abandoned secrets are eligible for cleanup after 24h", () => {
  const now = Date.now();
  assert.equal(isSecretAbandoned(now - 23 * 60 * 60 * 1000, now), false);
  assert.equal(isSecretAbandoned(now - 24 * 60 * 60 * 1000, now), true);
});

test("backoff, idempotency key, and secret delete rules", () => {
  assert.equal(nextAttemptDelaySeconds(1), 15);
  assert.equal(nextAttemptDelaySeconds(2), 30);
  assert.equal(nextAttemptDelaySeconds(8), 15 * 60);
  assert.equal(resendIdempotencyKey("abc"), "carry4me-email-queue-abc");
  assert.equal(
    shouldDeleteOtpSecret({
      finishWon: true,
      terminal: false,
      notificationType: "DELIVERY_OTP",
    }),
    true,
  );
  assert.equal(
    shouldDeleteOtpSecret({
      finishWon: false,
      terminal: false,
      notificationType: "DELIVERY_OTP",
    }),
    false,
  );
  assert.equal(EMAIL_QUEUE_MAX_ATTEMPTS, 5);
});

test("in-app copy distinguishes queued, sent, and failed", () => {
  const when = "after parcel handover";
  assert.match(deliveryOtpInAppBody("handover", "queued", when), /We're sending/);
  assert.match(deliveryOtpInAppBody("handover", "sent", when), /was sent/);
  assert.match(deliveryOtpInAppBody("handover", "failed", when), /couldn't email/);
});

test("lease and issue SQL use skip locked, cooldown lock, and cleanup", () => {
  const sql = read(
    "supabase/migrations/20261011040000_email_queue_otp_leases.sql",
  );
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /select \* into cr[\s\S]*for update/);
  assert.match(sql, /interval '60 seconds'/);
  assert.match(sql, /cleanup_delivery_otp_email_secrets/);
  assert.match(sql, /reclaim_stale_email_queue_leases/);
  assert.match(sql, /lease_token/);
  assert.match(sql, /otp_superseded/);
  assert.doesNotMatch(sql, /drop function public\.verify_delivery_otp/i);
});

test("workers claim before send and never report sent on provider failure", () => {
  const processor = read(
    "supabase/functions/_shared/emailQueueProcessor.ts",
  );
  const generate = read("supabase/functions/generate-delivery-otp/index.ts");
  const drain = read("supabase/functions/process-email-queue/index.ts");
  const mailer = read("supabase/functions/_shared/notificationEmail.ts");
  const page = read(
    "apps/web/src/app/features/carry request/ui/CarryRequestsPage.tsx",
  );

  assert.match(processor, /claimEmailQueueRow|claimDueEmailQueue/);
  assert.match(processor, /finishEmailQueueSent/);
  assert.match(processor, /resendIdempotencyKey/);
  assert.match(processor, /deleteDeliveryOtpSecret/);
  assert.match(processor, /finishWon && notificationType === "DELIVERY_OTP"/);
  assert.match(processor, /email_status: "sent"/);
  assert.match(processor, /lease_lost_after_provider/);
  assert.match(generate, /email_status/);
  assert.match(generate, /emailStatusFromQueueResult/);
  assert.doesNotMatch(
    generate,
    /A new delivery code was sent to the sender's email/,
  );
  assert.match(drain, /drain === true/);
  assert.match(drain, /processDueEmailQueue/);
  assert.match(drain, /isServiceRoleDrainToken/);
  assert.doesNotMatch(drain, /payload\.role === "service_role"/);
  assert.match(mailer, /Idempotency-Key/);
  assert.match(mailer, /AbortSignal\.timeout/);
  assert.match(page, /email_status/);
  assert.match(page, /being emailed to you/);
});
