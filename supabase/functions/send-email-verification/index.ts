import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "Carry4Me <notifications@carry4me.uk>";
const TOKEN_TTL_HOURS = 24;

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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, email_verified")
      .eq("id", authData.user.id)
      .maybeSingle<ProfileRow>();

    if (profileError) {
      console.error("Failed to load profile:", profileError);
      return jsonResponse({ error: "Failed to load profile" }, 500);
    }

    if (!profile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    if (!profile.email?.trim()) {
      return jsonResponse({ error: "Profile email is missing" }, 400);
    }

    if (profile.email_verified === true) {
      return jsonResponse({ ok: true, sent: false, reason: "already_verified" });
    }

    const expiresAt = new Date(
      Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000,
    ).toISOString();

    await supabaseAdmin
      .from("email_verification_tokens")
      .delete()
      .eq("user_id", authData.user.id);

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        user_id: authData.user.id,
        expires_at: expiresAt,
      })
      .select("token")
      .single();

    if (tokenError || !tokenRow?.token) {
      console.error("Failed to create verification token:", tokenError);
      return jsonResponse({ error: "Failed to create verification token" }, 500);
    }

    const appUrl = (Deno.env.get("APP_URL") ?? "https://carry4me.uk").replace(
      /\/$/,
      "",
    );
    const verifyUrl = `${appUrl}/verify-email?token=${tokenRow.token}`;

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [profile.email],
        subject: "Verify your Carry4Me email",
        html: `<p>Please verify your email to post parcels and trips on Carry4Me.</p><p><a href="${escapeHtml(verifyUrl)}">Verify email</a></p><p>This link expires in ${TOKEN_TTL_HOURS} hours.</p>`,
        text: `Please verify your email to post parcels and trips on Carry4Me.\n\n${verifyUrl}\n\nThis link expires in ${TOKEN_TTL_HOURS} hours.`,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, resendError);
      return jsonResponse({ error: "Failed to send verification email" }, 502);
    }

    const resendData = (await resendResponse.json()) as { id?: string };

    return jsonResponse({
      ok: true,
      sent: true,
      messageId: resendData.id ?? null,
    });
  } catch (error) {
    console.error("send-email-verification error:", error);
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
