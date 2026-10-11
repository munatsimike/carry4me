export const EMAIL_QUEUE_LEASE_SECONDS = 120;
export const EMAIL_QUEUE_MAX_ATTEMPTS = 5;
export const EMAIL_QUEUE_SECRET_TTL_HOURS = 24;
export const OTP_SUPERSEDED_ERROR = "otp_superseded";
export const OTP_SECRET_MISSING_ERROR = "otp_secret_missing";

export type EmailQueueClaimSnapshot = {
  id: string;
  notification_id: string;
  user_id?: string;
  status: string;
  attempts: number;
  last_error: string | null;
  lease_token: string | null;
  lease_expires_at: string | null;
  next_attempt_at: string | null;
};

export function resendIdempotencyKey(queueId: string): string {
  return `carry4me-email-queue-${queueId}`;
}

export function nextAttemptDelaySeconds(attemptsAfterFailure: number): number {
  const safe = Math.max(1, attemptsAfterFailure);
  return Math.min(15 * 60, 15 * 2 ** (safe - 1));
}

export function isTerminalEmailAttempt(attempts: number): boolean {
  return attempts >= EMAIL_QUEUE_MAX_ATTEMPTS;
}

export function isOtpSuperseded(lastError: string | null | undefined): boolean {
  return lastError === OTP_SUPERSEDED_ERROR;
}

export function canClaimEmailQueueRow(
  row: EmailQueueClaimSnapshot,
  nowMs: number,
): boolean {
  if (isOtpSuperseded(row.last_error)) {
    return false;
  }
  if (row.attempts >= EMAIL_QUEUE_MAX_ATTEMPTS) {
    return false;
  }
  const nextAttempt = row.next_attempt_at
    ? Date.parse(row.next_attempt_at)
    : 0;
  if (Number.isFinite(nextAttempt) && nextAttempt > nowMs) {
    return false;
  }

  if (row.status === "pending" || row.status === "failed") {
    return true;
  }

  if (row.status === "processing") {
    const expires = row.lease_expires_at
      ? Date.parse(row.lease_expires_at)
      : 0;
    return Number.isFinite(expires) && expires <= nowMs;
  }

  return false;
}

export function applyClaim(
  row: EmailQueueClaimSnapshot,
  leaseToken: string,
  nowMs: number,
  leaseSeconds = EMAIL_QUEUE_LEASE_SECONDS,
): EmailQueueClaimSnapshot | null {
  if (!canClaimEmailQueueRow(row, nowMs)) {
    return null;
  }
  return {
    ...row,
    status: "processing",
    lease_token: leaseToken,
    lease_expires_at: new Date(nowMs + leaseSeconds * 1000).toISOString(),
  };
}

export function canFinishClaimedRow(
  row: EmailQueueClaimSnapshot,
  leaseToken: string,
): boolean {
  return (
    row.status === "processing" &&
    row.lease_token === leaseToken &&
    !isOtpSuperseded(row.last_error)
  );
}

export function shouldDeleteOtpSecret(input: {
  finishWon: boolean;
  terminal: boolean;
  notificationType: string;
}): boolean {
  return input.notificationType === "DELIVERY_OTP" &&
    (input.finishWon || input.terminal);
}

export function shouldSendAfterPreSendCheck(input: {
  leaseStillHeld: boolean;
  superseded: boolean;
  secretPresent: boolean;
  notificationType: string;
}): boolean {
  if (!input.leaseStillHeld || input.superseded) {
    return false;
  }
  if (input.notificationType === "DELIVERY_OTP" && !input.secretPresent) {
    return false;
  }
  return true;
}

export type DeliveryOtpEmailStatus = "queued" | "sent" | "failed";

export function deliveryOtpInAppBody(
  preference: string | null | undefined,
  status: DeliveryOtpEmailStatus,
  giveWhen: string,
): string {
  if (status === "sent") {
    return `A delivery code was sent to your email. Give it to the traveler ${giveWhen} to release payment.`;
  }
  if (status === "failed") {
    return `We couldn't email your delivery code. Open the request and tap Resend, then give the new code to the traveler ${giveWhen} to release payment.`;
  }
  return `We're sending a delivery code to your email. Give it to the traveler ${giveWhen} once it arrives to release payment.`;
}

export function isSecretAbandoned(createdAtMs: number, nowMs: number): boolean {
  return nowMs - createdAtMs >= EMAIL_QUEUE_SECRET_TTL_HOURS * 60 * 60 * 1000;
}

export class InMemoryEmailQueue {
  private readonly rows: Map<string, EmailQueueClaimSnapshot>;

  constructor(rows: Map<string, EmailQueueClaimSnapshot>) {
    this.rows = rows;
  }

  claim(
    id: string,
    leaseToken: string,
    nowMs: number,
  ): EmailQueueClaimSnapshot | null {
    const row = this.rows.get(id);
    if (!row) return null;
    const claimed = applyClaim(row, leaseToken, nowMs);
    if (!claimed) return null;
    this.rows.set(id, claimed);
    return { ...claimed };
  }

  supersede(id: string): void {
    const row = this.rows.get(id);
    if (!row) return;
    this.rows.set(id, {
      ...row,
      status: "failed",
      last_error: OTP_SUPERSEDED_ERROR,
      lease_token: null,
      lease_expires_at: new Date(0).toISOString(),
    });
  }

  finishSent(id: string, leaseToken: string): boolean {
    const row = this.rows.get(id);
    if (!row || !canFinishClaimedRow(row, leaseToken)) return false;
    this.rows.set(id, {
      ...row,
      status: "sent",
      lease_token: null,
      lease_expires_at: null,
    });
    return true;
  }

  finishFailed(
    id: string,
    leaseToken: string,
    errorMessage: string,
    nowMs: number,
    terminal = false,
  ): boolean {
    const row = this.rows.get(id);
    if (!row || !canFinishClaimedRow(row, leaseToken)) return false;
    const attempts = row.attempts + 1;
    const isTerminal = terminal ||
      isOtpSuperseded(errorMessage) ||
      isTerminalEmailAttempt(attempts);
    this.rows.set(id, {
      ...row,
      status: "failed",
      attempts,
      last_error: errorMessage,
      lease_token: null,
      lease_expires_at: null,
      next_attempt_at: new Date(
        nowMs +
          (isTerminal
            ? 100 * 365 * 24 * 60 * 60 * 1000
            : nextAttemptDelaySeconds(attempts) * 1000),
      ).toISOString(),
    });
    return true;
  }

  expireLease(id: string, expiredAtMs: number): void {
    const row = this.rows.get(id);
    if (!row) return;
    this.rows.set(id, {
      ...row,
      lease_expires_at: new Date(expiredAtMs).toISOString(),
    });
  }

  get(id: string): EmailQueueClaimSnapshot | undefined {
    const row = this.rows.get(id);
    return row ? { ...row } : undefined;
  }
}
