import type { createClient } from "npm:@supabase/supabase-js@2";
import {
  EMAIL_QUEUE_LEASE_SECONDS,
  EMAIL_QUEUE_MAX_ATTEMPTS,
  OTP_SUPERSEDED_ERROR,
  type EmailQueueClaimSnapshot,
} from "./emailQueueClaim.ts";

type Admin = ReturnType<typeof createClient>;

function asQueueRow(data: unknown): EmailQueueClaimSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const row = data as EmailQueueClaimSnapshot;
  if (!row.id || !row.notification_id) return null;
  return row;
}

export async function claimEmailQueueRow(
  supabaseAdmin: Admin,
  queueId: string,
  leaseToken: string,
): Promise<EmailQueueClaimSnapshot | null> {
  const { data, error } = await supabaseAdmin.rpc("claim_email_queue_row", {
    p_id: queueId,
    p_lease_token: leaseToken,
    p_lease_seconds: EMAIL_QUEUE_LEASE_SECONDS,
  });

  if (error) {
    console.error("claim_email_queue_row failed", error.message);
    return null;
  }

  return asQueueRow(data);
}

export async function claimDueEmailQueue(
  supabaseAdmin: Admin,
  limit = 20,
): Promise<EmailQueueClaimSnapshot[]> {
  const { data, error } = await supabaseAdmin.rpc("claim_due_email_queue", {
    p_limit: limit,
    p_lease_seconds: EMAIL_QUEUE_LEASE_SECONDS,
  });

  if (error) {
    console.error("claim_due_email_queue failed", error.message);
    return [];
  }

  return (Array.isArray(data) ? data : []).map(asQueueRow).filter((
    row,
  ): row is EmailQueueClaimSnapshot => row !== null);
}

export async function emailQueueLeaseIsActive(
  supabaseAdmin: Admin,
  queueId: string,
  leaseToken: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("email_queue_lease_is_active", {
    p_id: queueId,
    p_lease_token: leaseToken,
  });

  if (error) {
    console.error("email_queue_lease_is_active failed", error.message);
    return false;
  }

  return data === true;
}

export async function finishEmailQueueSent(
  supabaseAdmin: Admin,
  queueId: string,
  leaseToken: string,
  providerNote: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("finish_email_queue_sent", {
    p_id: queueId,
    p_lease_token: leaseToken,
    p_provider_note: providerNote,
  });

  if (error) {
    console.error("finish_email_queue_sent failed", error.message);
    return false;
  }

  return data === true;
}

export async function finishEmailQueueFailed(
  supabaseAdmin: Admin,
  queueId: string,
  leaseToken: string,
  errorMessage: string,
  terminal = false,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("finish_email_queue_failed", {
    p_id: queueId,
    p_lease_token: leaseToken,
    p_error: errorMessage,
    p_terminal: terminal || errorMessage === OTP_SUPERSEDED_ERROR,
  });

  if (error) {
    console.error("finish_email_queue_failed failed", error.message);
    return false;
  }

  return data === true;
}

export async function cleanupDeliveryOtpSecrets(supabaseAdmin: Admin): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc(
    "cleanup_delivery_otp_email_secrets",
  );
  if (error) {
    console.error("cleanup_delivery_otp_email_secrets failed", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

export async function reclaimStaleEmailQueueLeases(
  supabaseAdmin: Admin,
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc(
    "reclaim_stale_email_queue_leases",
  );
  if (error) {
    console.error("reclaim_stale_email_queue_leases failed", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

export function isTerminalQueueFailure(
  attempts: number,
  errorMessage: string,
): boolean {
  return (
    attempts + 1 >= EMAIL_QUEUE_MAX_ATTEMPTS ||
    errorMessage === OTP_SUPERSEDED_ERROR ||
    errorMessage.startsWith("max_attempts_reached")
  );
}
