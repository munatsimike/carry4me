import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  sendNotificationEmailViaResend,
  type NotificationRow,
  type ProfileRow,
} from "../_shared/notificationEmail.ts";

type RequestBody = {
  emailQueueId?: string;
  notificationId?: string;
  limit?: number;
};

type EmailQueueRow = {
  id: string;
  notification_id: string;
  user_id: string;
  status: string;
  attempts: number;
};

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: RequestBody = {};
    try {
      if (req.headers.get("content-length") !== "0") {
        body = await req.json();
      }
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    if (!resendApiKey) {
      return jsonResponse({ error: "Email service is not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const emailQueueId = body.emailQueueId?.trim();
    const notificationId = body.notificationId?.trim();
    const limit = Math.min(
      Math.max(body.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    let query = supabaseAdmin
      .from("email_queue")
      .select("id, notification_id, user_id, status, attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (emailQueueId) {
      query = query.eq("id", emailQueueId);
    } else if (notificationId) {
      query = query.eq("notification_id", notificationId);
    }

    const { data: queueRows, error: queueError } = await query;

    if (queueError) {
      console.error("Failed to load email queue:", queueError);
      return jsonResponse({ error: "Failed to load email queue" }, 500);
    }

    if (!queueRows?.length) {
      return jsonResponse({ ok: true, processed: 0, results: [] });
    }

    const results: Array<Record<string, unknown>> = [];

    for (const row of queueRows as EmailQueueRow[]) {
      const result = await processQueueRow(
        supabaseAdmin,
        row,
        resendApiKey,
      );
      results.push(result);
    }

    return jsonResponse({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("process-email-queue error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function processQueueRow(
  supabaseAdmin: ReturnType<typeof createClient>,
  row: EmailQueueRow,
  resendApiKey: string,
) {
  const nextAttempts = row.attempts + 1;

  const { data: notification, error: notificationError } = await supabaseAdmin
    .from("notifications")
    .select("id, user_id, title, body, link")
    .eq("id", row.notification_id)
    .maybeSingle<NotificationRow>();

  if (notificationError || !notification) {
    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      notificationError?.message ?? "Notification not found",
    );

    return {
      emailQueueId: row.id,
      ok: false,
      status: "failed",
      error: "Notification not found",
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email, email_verified")
    .eq("id", row.user_id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile) {
    await markQueueFailed(
      supabaseAdmin,
      row.id,
      nextAttempts,
      profileError?.message ?? "Recipient profile not found",
    );

    return {
      emailQueueId: row.id,
      ok: false,
      status: "failed",
      error: "Recipient profile not found",
    };
  }

  try {
    const outcome = await sendNotificationEmailViaResend(
      notification,
      profile,
      resendApiKey,
    );

    if (!outcome.sent) {
      await markQueueSent(
        supabaseAdmin,
        row.id,
        nextAttempts,
        `skipped:${outcome.reason}`,
      );

      return {
        emailQueueId: row.id,
        ok: true,
        status: "sent",
        sent: false,
        reason: outcome.reason,
      };
    }

    await markQueueSent(supabaseAdmin, row.id, nextAttempts, null);

    return {
      emailQueueId: row.id,
      ok: true,
      status: "sent",
      sent: true,
      messageId: outcome.messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await markQueueFailed(supabaseAdmin, row.id, nextAttempts, message);

    return {
      emailQueueId: row.id,
      ok: false,
      status: "failed",
      error: message,
    };
  }
}

async function markQueueSent(
  supabaseAdmin: ReturnType<typeof createClient>,
  emailQueueId: string,
  attempts: number,
  lastError: string | null,
) {
  const { error } = await supabaseAdmin
    .from("email_queue")
    .update({
      status: "sent",
      attempts,
      sent_at: new Date().toISOString(),
      last_error: lastError,
    })
    .eq("id", emailQueueId)
    .eq("status", "pending");

  if (error) {
    console.error("Failed to mark email queue sent:", error);
  }
}

async function markQueueFailed(
  supabaseAdmin: ReturnType<typeof createClient>,
  emailQueueId: string,
  attempts: number,
  lastError: string,
) {
  const { error } = await supabaseAdmin
    .from("email_queue")
    .update({
      status: "failed",
      attempts,
      last_error: lastError,
    })
    .eq("id", emailQueueId)
    .eq("status", "pending");

  if (error) {
    console.error("Failed to mark email queue failed:", error);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
