import { createClient } from "npm:@supabase/supabase-js@2";
import {
  EMAIL_QUEUE_MAX_ATTEMPTS,
  OTP_SECRET_MISSING_ERROR,
  OTP_SUPERSEDED_ERROR,
  resendIdempotencyKey,
  shouldSendAfterPreSendCheck,
} from "./emailQueueClaim.ts";
import {
  claimDueEmailQueue,
  claimEmailQueueRow,
  cleanupDeliveryOtpSecrets,
  emailQueueLeaseIsActive,
  finishEmailQueueFailed,
  finishEmailQueueSent,
  isTerminalQueueFailure,
  reclaimStaleEmailQueueLeases,
} from "./emailQueueLeaseRpc.ts";
import {
  deleteDeliveryOtpSecret,
  peekDeliveryOtpSecret,
  redactOtpDigits,
} from "./deliveryOtpMail.ts";
import { enrichNotificationForEmail } from "./emails/notificationEmailEnrichment.ts";
import {
  sendNotificationEmailViaResend,
  type NotificationRow,
  type ProfileRow,
} from "./notificationEmail.ts";

export type EmailQueueRow = {
  id: string;
  notification_id: string;
  user_id: string;
  status: string;
  attempts: number;
  last_error: string | null;
  lease_token?: string | null;
  lease_expires_at?: string | null;
  next_attempt_at?: string | null;
  created_at?: string;
  notifications?: { type: string } | null;
};

/** Notification types that should receive carry-request emails. */
export const EMAIL_PROCESSABLE_NOTIFICATION_TYPES = [
  "REQUEST_SENT",
  "REQUEST_ACCEPTED",
  "REQUEST_REJECTED",
  "REQUEST_CANCELED",
  "PAYMENT_COMPLETED",
  "DELIVERY_OTP",
  "HANDOVER_CONFIRMED",
  "PARCEL_RECEIVED",
  "PARCEL_DELIVERED",
  "PAYMENT_RELEASED",
  "TRAVELER_BANK_PAYOUT",
  "MATCHING_TRIP_POSTED",
  "MATCHING_PARCEL_POSTED",
] as const;

export type EmailProcessableNotificationType =
  (typeof EMAIL_PROCESSABLE_NOTIFICATION_TYPES)[number];

export const USER_PROCESSABLE_STATUSES = [
  "pending",
  "skipped",
  "failed",
  "processing",
] as const;

export const MAX_EMAIL_ATTEMPTS = EMAIL_QUEUE_MAX_ATTEMPTS;

export function isEmailProcessableNotificationType(
  type: string | null | undefined,
): type is EmailProcessableNotificationType {
  if (!type) {
    return false;
  }
  return (EMAIL_PROCESSABLE_NOTIFICATION_TYPES as readonly string[]).includes(
    type,
  );
}

export async function loadExactQueueRow(
  supabaseAdmin: ReturnType<typeof createClient>,
  target: { emailQueueId?: string; notificationId?: string },
): Promise<EmailQueueRow | null> {
  let query = supabaseAdmin
    .from("email_queue")
    .select(
      "id, notification_id, user_id, status, attempts, last_error, lease_token, lease_expires_at, next_attempt_at, created_at, notifications!inner(type)",
    );

  if (target.emailQueueId) {
    query = query.eq("id", target.emailQueueId);
  } else if (target.notificationId) {
    query = query.eq("notification_id", target.notificationId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Failed to load email_queue row:", error);
    throw error;
  }

  return (data as EmailQueueRow | null) ?? null;
}

export async function loadQueueRowByCarryRequestEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  carryRequestId: string,
  eventType: string,
): Promise<EmailQueueRow | null> {
  const rows = await loadQueueRowsByCarryRequestEvent(
    supabaseAdmin,
    carryRequestId,
    eventType,
  );

  return rows[0] ?? null;
}

export async function processCarryRequestEventEmails(
  supabaseAdmin: ReturnType<typeof createClient>,
  carryRequestId: string,
  eventType: string,
  resendApiKey: string | null | undefined,
): Promise<{ processed: number; results: Awaited<ReturnType<typeof processQueueRow>>[] }> {
  if (!resendApiKey?.trim()) {
    console.warn(
      "processCarryRequestEventEmails: RESEND_API_KEY not set; emails remain queued",
      { carryRequestId, eventType },
    );
    return { processed: 0, results: [] };
  }

  const rows = await loadQueueRowsByCarryRequestEvent(
    supabaseAdmin,
    carryRequestId,
    eventType,
  );

  const results = [];
  for (const row of rows) {
    results.push(
      await processQueueRow(supabaseAdmin, row, resendApiKey.trim(), {
        allowedStatuses: USER_PROCESSABLE_STATUSES,
      }),
    );
  }

  const processed = results.filter((result) => result.processed === true).length;

  return { processed, results };
}

export async function loadQueueRowsByCarryRequestEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  carryRequestId: string,
  eventType: string,
): Promise<EmailQueueRow[]> {
  const { data, error } = await supabaseAdmin
    .from("email_queue")
    .select(
      "id, notification_id, user_id, status, attempts, last_error, lease_token, lease_expires_at, next_attempt_at, created_at, notifications!inner(type, metadata)",
    )
    .eq("notifications.type", eventType)
    .filter(
      "notifications.metadata->>carry_request_id",
      "eq",
      carryRequestId,
    )
    .in("status", ["pending", "failed", "processing"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load email_queue by carry request event:", error);
    throw error;
  }

  return (data as EmailQueueRow[] | null) ?? [];
}

export async function assertCarryRequestParticipant(
  supabaseAdmin: ReturnType<typeof createClient>,
  carryRequestId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("carry_requests")
    .select("sender_user_id, traveler_user_id")
    .eq("id", carryRequestId)
    .maybeSingle();

  if (error) {
    console.error("Failed to verify carry request participant:", error);
    throw error;
  }

  if (!data) {
    return false;
  }

  return data.sender_user_id === userId || data.traveler_user_id === userId;
}

export async function assertListingMatchPoster(
  supabaseAdmin: ReturnType<typeof createClient>,
  matchedListingType: string,
  matchedListingId: string,
  userId: string,
): Promise<boolean> {
  if (matchedListingType === "trip") {
    const { data, error } = await supabaseAdmin
      .from("trips")
      .select("traveler_user_id")
      .eq("id", matchedListingId)
      .maybeSingle();

    if (error) {
      console.error("Failed to verify trip poster:", error);
      throw error;
    }

    return data?.traveler_user_id === userId;
  }

  if (matchedListingType === "parcel") {
    const { data, error } = await supabaseAdmin
      .from("parcels")
      .select("sender_user_id")
      .eq("id", matchedListingId)
      .maybeSingle();

    if (error) {
      console.error("Failed to verify parcel poster:", error);
      throw error;
    }

    return data?.sender_user_id === userId;
  }

  return false;
}

export async function loadQueueRowsByListingMatchEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  matchedListingType: string,
  matchedListingId: string,
  eventType: string,
): Promise<EmailQueueRow[]> {
  const { data, error } = await supabaseAdmin
    .from("email_queue")
    .select(
      "id, notification_id, user_id, status, attempts, last_error, lease_token, lease_expires_at, next_attempt_at, created_at, notifications!inner(type, metadata)",
    )
    .eq("notifications.type", eventType)
    .filter(
      "notifications.metadata->>matched_listing_type",
      "eq",
      matchedListingType,
    )
    .filter(
      "notifications.metadata->>matched_listing_id",
      "eq",
      matchedListingId,
    )
    .in("status", ["pending", "failed", "processing"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load email_queue by listing match event:", error);
    throw error;
  }

  return (data as EmailQueueRow[] | null) ?? [];
}

export async function processDueEmailQueue(
  supabaseAdmin: ReturnType<typeof createClient>,
  resendApiKey: string,
  limit = 20,
) {
  await reclaimStaleEmailQueueLeases(supabaseAdmin);
  await cleanupDeliveryOtpSecrets(supabaseAdmin);
  const claimed = await claimDueEmailQueue(supabaseAdmin, limit);
  const results = [];
  for (const row of claimed) {
    results.push(
      await processQueueRow(supabaseAdmin, {
        ...row,
        user_id: row.user_id ?? "",
        notifications: null,
      }, resendApiKey, {
        allowedStatuses: USER_PROCESSABLE_STATUSES,
        alreadyClaimed: true,
      }),
    );
  }
  return {
    processed: results.filter((result) => result.processed === true).length,
    results,
  };
}

export async function processQueueRow(
  supabaseAdmin: ReturnType<typeof createClient>,
  row: EmailQueueRow,
  resendApiKey: string,
  options: { allowedStatuses: readonly string[]; alreadyClaimed?: boolean },
) {
  if (row.status === "sent") {
    return {
      emailQueueId: row.id,
      notificationId: row.notification_id,
      processed: false,
      ok: true,
      status: row.status,
      hint: "Already sent.",
    };
  }

  if (
    row.last_error === OTP_SUPERSEDED_ERROR ||
    !options.allowedStatuses.includes(row.status)
  ) {
    return {
      emailQueueId: row.id,
      notificationId: row.notification_id,
      processed: false,
      ok: true,
      status: row.status,
      hint: row.last_error === OTP_SUPERSEDED_ERROR
        ? "otp_superseded"
        : `Row status "${row.status}" is not processable.`,
    };
  }

  let leaseToken = options.alreadyClaimed && row.lease_token
    ? row.lease_token
    : crypto.randomUUID();
  let held = row;

  if (!options.alreadyClaimed || !row.lease_token) {
    const claimed = await claimEmailQueueRow(supabaseAdmin, row.id, leaseToken);
    if (!claimed) {
      return {
        emailQueueId: row.id,
        notificationId: row.notification_id,
        processed: false,
        ok: true,
        status: row.status,
        hint: "not_claimed",
      };
    }
    held = {
      ...row,
      ...claimed,
      user_id: claimed.user_id ?? row.user_id,
      lease_token: claimed.lease_token,
    };
    leaseToken = claimed.lease_token ?? leaseToken;
  }

  const failHeld = async (
    errorMessage: string,
    notification: NotificationRow | null,
    recipientEmail: string | null,
    terminal = false,
  ) => {
    const redacted = redactOtpDigits(errorMessage);
    const isTerminal = terminal || isTerminalQueueFailure(held.attempts, redacted);
    await finishEmailQueueFailed(
      supabaseAdmin,
      held.id,
      leaseToken,
      redacted,
      isTerminal,
    );
    if (isTerminal) {
      await deleteDeliveryOtpSecret(supabaseAdmin, held.notification_id);
    }
    return buildResult(held, notification, recipientEmail, {
      processed: false,
      ok: false,
      status: "failed",
      error: redacted,
    });
  };

  const { data: notification, error: notificationError } = await supabaseAdmin
    .from("notifications")
    .select("id, user_id, type, title, body, link, metadata")
    .eq("id", held.notification_id)
    .maybeSingle<NotificationRow>();

  if (notificationError || !notification) {
    return await failHeld(
      notificationError?.message ?? "Notification not found",
      notification ?? null,
      null,
    );
  }

  if (!isEmailProcessableNotificationType(notification.type)) {
    return await failHeld(
      `notification_type_not_processable:${notification.type}`,
      notification,
      null,
      true,
    );
  }

  if (!notification.title?.trim() || !notification.body?.trim()) {
    return await failHeld(
      "notification_template_missing:title_or_body_empty",
      notification,
      null,
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email, email_verified")
    .eq("id", held.user_id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile) {
    return await failHeld(
      profileError?.message ?? "Recipient profile not found",
      notification,
      null,
    );
  }

  const recipientEmail = await resolveRecipientEmail(
    supabaseAdmin,
    held.user_id,
    profile,
  );

  if (!recipientEmail) {
    return await failHeld(
      "email_missing: no email on profile or auth user",
      notification,
      null,
    );
  }

  const notificationType = notification.type?.trim().toUpperCase() ?? "";
  let deliveryOtp: string | null = null;
  if (notificationType === "DELIVERY_OTP") {
    deliveryOtp = await peekDeliveryOtpSecret(supabaseAdmin, notification.id);
    if (!deliveryOtp) {
      return await failHeld(OTP_SECRET_MISSING_ERROR, notification, recipientEmail, true);
    }
  }

  const leaseStillHeld = await emailQueueLeaseIsActive(
    supabaseAdmin,
    held.id,
    leaseToken,
  );
  const { data: preSendRow } = await supabaseAdmin
    .from("email_queue")
    .select("last_error")
    .eq("id", held.id)
    .maybeSingle<{ last_error: string | null }>();
  const superseded = preSendRow?.last_error === OTP_SUPERSEDED_ERROR;
  if (
    !shouldSendAfterPreSendCheck({
      leaseStillHeld,
      superseded,
      secretPresent: notificationType !== "DELIVERY_OTP" || Boolean(deliveryOtp),
      notificationType,
    })
  ) {
    if (superseded || !deliveryOtp) {
      return await failHeld(
        superseded ? OTP_SUPERSEDED_ERROR : OTP_SECRET_MISSING_ERROR,
        notification,
        recipientEmail,
        true,
      );
    }
    return buildResult(held, notification, recipientEmail, {
      processed: false,
      ok: false,
      status: "failed",
      error: "lease_lost_before_provider",
      sent: false,
    });
  }

  try {
    const enrichedNotification = await enrichNotificationForEmail(
      supabaseAdmin,
      notification,
      { deliveryOtp },
    );

    const outcome = await sendNotificationEmailViaResend(
      enrichedNotification,
      { email: recipientEmail, email_verified: profile.email_verified },
      resendApiKey,
      {
        requireEmailVerified: false,
        idempotencyKey: resendIdempotencyKey(held.id),
      },
    );

    if (!outcome.sent) {
      return await failHeld(
        `precheck_failed:${outcome.reason}`,
        notification,
        recipientEmail,
      );
    }

    const stillHeld = await emailQueueLeaseIsActive(
      supabaseAdmin,
      held.id,
      leaseToken,
    );
    if (!stillHeld) {
      return buildResult(held, notification, recipientEmail, {
        processed: false,
        ok: false,
        status: "failed",
        error: "lease_lost_after_provider",
        sent: false,
      });
    }

    const providerNote = outcome.messageId
      ? `resend:${outcome.messageId}`
      : JSON.stringify(outcome.providerResponse).slice(0, 500);

    const finishWon = await finishEmailQueueSent(
      supabaseAdmin,
      held.id,
      leaseToken,
      providerNote,
    );

    if (finishWon && notificationType === "DELIVERY_OTP") {
      await deleteDeliveryOtpSecret(supabaseAdmin, notification.id);
    }

    if (!finishWon) {
      return buildResult(held, notification, recipientEmail, {
        processed: false,
        ok: false,
        status: "failed",
        error: "lease_lost_after_provider",
        sent: false,
      });
    }

    return buildResult(held, notification, recipientEmail, {
      processed: true,
      ok: true,
      status: "sent",
      sent: true,
      email_status: "sent",
      messageId: outcome.messageId,
      providerResponse: outcome.providerResponse,
    });
  } catch (error) {
    const errorMessage = redactOtpDigits(
      error instanceof Error ? error.message : String(error),
    );
    console.error("process-email-queue provider error:", errorMessage);
    return await failHeld(errorMessage, notification, recipientEmail);
  }
}

function buildResult(
  row: EmailQueueRow,
  notification: NotificationRow | null,
  recipientEmail: string | null,
  result: Record<string, unknown>,
) {
  return {
    emailQueueId: row.id,
    notificationId: row.notification_id,
    notificationType: notification?.type ?? row.notifications?.type ?? null,
    recipientEmail,
    ...result,
  };
}

async function resolveRecipientEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  profile: ProfileRow,
): Promise<string | null> {
  const profileEmail = profile.email?.trim();
  if (profileEmail) {
    return profileEmail;
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin
    .getUserById(userId);

  if (authError) {
    console.error("Failed to load auth user for email fallback:", authError);
    return null;
  }

  return authData.user?.email?.trim() ?? null;
}

export function emailStatusFromQueueResult(
  result: { sent?: unknown; status?: unknown; error?: unknown },
): "queued" | "sent" | "failed" {
  if (result.sent === true && result.status === "sent") {
    return "sent";
  }
  const error = typeof result.error === "string" ? result.error : "";
  if (
    error === OTP_SUPERSEDED_ERROR ||
    error === OTP_SECRET_MISSING_ERROR ||
    error.startsWith("max_attempts_reached") ||
    error.startsWith("notification_type_not_processable")
  ) {
    return "failed";
  }
  return "queued";
}
