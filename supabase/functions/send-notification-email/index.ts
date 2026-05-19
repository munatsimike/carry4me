import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * MVP: frontend/repository invokes this function with notificationId after DB creates
 * a notification for the recipient (actor and recipient are often different users).
 *
 * TODO (email_queue): replace direct invoke with a durable queue processed server-side:
 * - email_queue table
 * - sent_at
 * - resend_message_id
 * - retry_count
 * - failed_reason
 * - scheduled retries
 *
 * Target flow: DB trigger → insert notification → insert email_queue row → scheduled
 * Edge Function drains email_queue.
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "Carry4Me <notifications@carry4me.uk>";

type RequestBody = {
  notificationId?: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
};

type ProfileRow = {
  email: string | null;
  email_verified: boolean;
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
      console.error("Missing Supabase environment variables");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
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

    // Recipient is notification.user_id; caller may be a different user (e.g. carry-request actor).
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

    if (!profile.email) {
      return jsonResponse({ ok: true, sent: false, reason: "email_missing" });
    }

    if (profile.email_verified !== true) {
      return jsonResponse({ ok: true, sent: false, reason: "email_not_verified" });
    }

    const appUrl = (Deno.env.get("APP_URL") ?? "https://carry4me.uk").replace(
      /\/$/,
      "",
    );
    const absoluteLink = notification.link
      ? notification.link.startsWith("http")
        ? notification.link
        : `${appUrl}${notification.link.startsWith("/") ? notification.link : `/${notification.link}`}`
      : null;

    const textBody = absoluteLink
      ? `${notification.body}\n\n${absoluteLink}`
      : notification.body;

    const htmlBody = absoluteLink
      ? `<p>${escapeHtml(notification.body)}</p><p><a href="${escapeHtml(absoluteLink)}">View in Carry4Me</a></p>`
      : `<p>${escapeHtml(notification.body)}</p>`;

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [profile.email],
        subject: notification.title,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, resendError);
      return jsonResponse({ error: "Failed to send email" }, 502);
    }

    const resendData = (await resendResponse.json()) as { id?: string };

    return jsonResponse({
      ok: true,
      sent: true,
      messageId: resendData.id ?? null,
    });
  } catch (error) {
    console.error("send-notification-email error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
