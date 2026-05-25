import { createClient } from "npm:@supabase/supabase-js@2";
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
  "HANDOVER_CONFIRMED",
  "PARCEL_RECEIVED",
  "PARCEL_DELIVERED",
  "PAYMENT_RELEASED",
] as const;

export type EmailProcessableNotificationType =
  (typeof EMAIL_PROCESSABLE_NOTIFICATION_TYPES)[number];

export const USER_PROCESSABLE_STATUSES = ["pending", "skipped", "failed"] as const;

export const MAX_EMAIL_ATTEMPTS = 5;

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
      "id, notification_id, user_id, status, attempts, last_error, created_at, notifications!inner(type)",
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
  const { data, error } = await supabaseAdmin
    .from("email_queue")
    .select(
      "id, notification_id, user_id, status, attempts, last_error, created_at, notifications!inner(type, metadata)",
    )
    .eq("notifications.type", eventType)
    .filter(
      "notifications.metadata->>carry_request_id",
      "eq",
      carryRequestId,
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load email_queue by carry request event:", error);
    throw error;
  }

  return (data as EmailQueueRow | null) ?? null;
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

export async function processQueueRow(
  supabaseAdmin: ReturnType<typeof createClient>,
  row: EmailQueueRow,
  resendApiKey: string,
  options: { allowedStatuses: readonly string[] },
) {
  const nextAttempts = row.attempts + 1;
  const updateFromStatuses = [...new Set([...options.allowedStatuses, row.status])];

  if (!options.allowedStatuses.includes(row.status)) {
    const hint = row.status === "sent"
      ? `Already sent${row.last_error ? ` (${row.last_error})` : ""}.`
      : `Row status "${row.status}" is not processable.`;

    return {
      emailQueueId: row.id,
      notificationId: row.notification_id,
      processed: false,
      ok: true,
      status: row.status,
      hint,
    };
  }

  if (row.attempts >= MAX_EMAIL_ATTEMPTS) {
    const errorMessage = `max_attempts_reached:${MAX_EMAIL_ATTEMPTS}`;
    await markQueueFailed(
      supabaseAdmin,
      row.id,
      row.attempts,
      errorMessage,
      updateFromStatuses,
    );

    return buildResult(row, null, null, {
      processed: false,
      ok: false,
      status: "failed",
      error: errorMessage,
    });
  }

  const { data: notification, error: notificationError } = await supabaseAdmin
    .from("notifications")
    .select("id, user_id, type, title, body, link")
    .eq("id", row.notification_id)
    .maybeSingle<NotificationRow>();

  if (notificationError || !notification) {
    const errorMessage = notificationError?.message ?? "Notification not found";
    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      errorMessage,
      updateFromStatuses,
    );

    return buildResult(row, notification ?? null, null, {
      processed: false,
      ok: false,
      status: "failed",
      error: errorMessage,
    });
  }

  if (!isEmailProcessableNotificationType(notification.type)) {
    const errorMessage = `notification_type_not_processable:${notification.type}`;

    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      errorMessage,
      updateFromStatuses,
    );

    return buildResult(row, notification, null, {
      processed: false,
      ok: false,
      status: "failed",
      error: errorMessage,
    });
  }

  if (!notification.title?.trim() || !notification.body?.trim()) {
    const errorMessage = "notification_template_missing:title_or_body_empty";
    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      errorMessage,
      updateFromStatuses,
    );

    return buildResult(row, notification, null, {
      processed: false,
      ok: false,
      status: "failed",
      error: errorMessage,
    });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email, email_verified")
    .eq("id", row.user_id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile) {
    const errorMessage = profileError?.message ?? "Recipient profile not found";
    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      errorMessage,
      updateFromStatuses,
    );

    return buildResult(row, notification, null, {
      processed: false,
      ok: false,
      status: "failed",
      error: errorMessage,
    });
  }

  const recipientEmail = await resolveRecipientEmail(
    supabaseAdmin,
    row.user_id,
    profile,
  );

  if (!recipientEmail) {
    const errorMessage = "email_missing: no email on profile or auth user";
    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      errorMessage,
      updateFromStatuses,
    );

    return buildResult(row, notification, null, {
      processed: false,
      ok: false,
      status: "failed",
      error: errorMessage,
    });
  }

  try {
    const outcome = await sendNotificationEmailViaResend(
      notification,
      { email: recipientEmail, email_verified: profile.email_verified },
      resendApiKey,
      { requireEmailVerified: false },
    );

    if (!outcome.sent) {
      const errorMessage = `precheck_failed:${outcome.reason}`;
      await markQueueFailed(
        supabaseAdmin,
        row.id,
        nextAttempts,
        errorMessage,
        updateFromStatuses,
      );

      return buildResult(row, notification, recipientEmail, {
        processed: false,
        ok: false,
        status: "failed",
        error: errorMessage,
      });
    }

    const providerNote = outcome.messageId
      ? `resend:${outcome.messageId}`
      : JSON.stringify(outcome.providerResponse).slice(0, 500);

    await markQueueSent(
      supabaseAdmin,
      row.id,
      nextAttempts,
      providerNote,
      updateFromStatuses,
    );

    return buildResult(row, notification, recipientEmail, {
      processed: true,
      ok: true,
      status: "sent",
      sent: true,
      messageId: outcome.messageId,
      providerResponse: outcome.providerResponse,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("process-email-queue provider error:", errorMessage);

    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      errorMessage,
      updateFromStatuses,
    );

    return buildResult(row, notification, recipientEmail, {
      processed: false,
      ok: false,
      status: "failed",
      error: errorMessage,
    });
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

async function markQueueSent(
  supabaseAdmin: ReturnType<typeof createClient>,
  emailQueueId: string,
  attempts: number,
  providerNote: string,
  allowedStatuses: readonly string[],
) {
  const { error } = await supabaseAdmin
    .from("email_queue")
    .update({
      status: "sent",
      attempts,
      sent_at: new Date().toISOString(),
      last_error: providerNote,
    })
    .eq("id", emailQueueId)
    .in("status", [...allowedStatuses]);

  if (error) {
    console.error("Failed to mark email queue sent:", error);
    throw error;
  }
}

async function markQueueFailed(
  supabaseAdmin: ReturnType<typeof createClient>,
  emailQueueId: string,
  attempts: number,
  errorMessage: string,
  allowedStatuses: readonly string[],
) {
  const { error } = await supabaseAdmin
    .from("email_queue")
    .update({
      status: "failed",
      attempts,
      last_error: errorMessage,
      sent_at: null,
    })
    .eq("id", emailQueueId)
    .in("status", [...allowedStatuses]);

  if (error) {
    console.error("Failed to mark email queue failed:", error);
    throw error;
  }
}
