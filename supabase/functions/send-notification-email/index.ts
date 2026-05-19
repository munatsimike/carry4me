import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  sendNotificationEmailViaResend,
  type NotificationRow,
  type ProfileRow,
} from "../_shared/notificationEmail.ts";

/**
 * Legacy/direct invoke by notificationId.
 * Prefer process-email-queue for rows created by perform_carry_request_action.
 */

type RequestBody = {
  notificationId?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const notificationId = body.notificationId?.trim();
    if (!notificationId) {
      return jsonResponse({ error: "notificationId is required" }, 400);
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

    const { data: notification, error: notificationError } = await supabaseAdmin
      .from("notifications")
      .select("id, user_id, title, body, link")
      .eq("id", notificationId)
      .maybeSingle<NotificationRow>();

    if (notificationError) {
      console.error("Failed to load notification:", notificationError);
      return jsonResponse({ error: "Failed to load notification" }, 500);
    }

    if (!notification) {
      return jsonResponse({ error: "Notification not found" }, 404);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, email_verified")
      .eq("id", notification.user_id)
      .maybeSingle<ProfileRow>();

    if (profileError) {
      console.error("Failed to load recipient profile:", profileError);
      return jsonResponse({ error: "Failed to load recipient profile" }, 500);
    }

    if (!profile) {
      return jsonResponse({ error: "Recipient profile not found" }, 404);
    }

    const outcome = await sendNotificationEmailViaResend(
      notification,
      profile,
      resendApiKey,
    );

    if (!outcome.sent) {
      return jsonResponse({ ok: true, sent: false, reason: outcome.reason });
    }

    return jsonResponse({
      ok: true,
      sent: true,
      messageId: outcome.messageId,
    });
  } catch (error) {
    console.error("send-notification-email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return jsonResponse({ error: message }, 502);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
