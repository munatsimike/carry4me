import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  FROM_ADDRESS,
  RESEND_API_URL,
} from "../_shared/notificationEmail.ts";

type RequestBody = {
  email?: string;
};

type LatestOtpRow = {
  cooldown_until: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json",
    },
  });
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateNumericOtp(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateSaltHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}

async function hashOtp(saltHex: string, otp: string): Promise<string> {
  return await sha256Hex(`${saltHex}:${otp}`);
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

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

    const rawEmail = body.email ?? "";
    const email = normalizeEmail(rawEmail);
    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: "A valid email is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: latestRow, error: latestError } = await supabaseAdmin
      .from("email_login_otps")
      .select("cooldown_until")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<LatestOtpRow>();

    if (latestError) {
      console.error("send-email-login-otp latest row load failed", latestError);
      return jsonResponse({ error: "Could not process request" }, 500);
    }

    const now = Date.now();
    if (latestRow?.cooldown_until) {
      const cooldownUntilMs = new Date(latestRow.cooldown_until).getTime();
      if (Number.isFinite(cooldownUntilMs) && cooldownUntilMs > now) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((cooldownUntilMs - now) / 1000),
        );
        return jsonResponse(
          {
            error: "Please wait before requesting another code.",
            retry_after_seconds: retryAfterSeconds,
          },
          429,
        );
      }
    }

    const otp = generateNumericOtp();
    const saltHex = generateSaltHex();
    const otpHash = await hashOtp(saltHex, otp);
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();
    const cooldownUntil = new Date(now + 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("email_login_otps")
      .insert({
        email,
        otp_hash: otpHash,
        otp_salt: saltHex,
        expires_at: expiresAt,
        attempts: 0,
        max_attempts: 5,
        cooldown_until: cooldownUntil,
        updated_at: new Date(now).toISOString(),
      });

    if (insertError) {
      console.error("send-email-login-otp insert failed", insertError);
      return jsonResponse({ error: "Could not issue email code" }, 500);
    }

    const subject = "Your Carry4Me sign-in code";
    const html = `
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#0f172a;line-height:24px;margin:0 0 12px 0;">
        Your Carry4Me sign-in code is:
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:28px;letter-spacing:6px;font-weight:700;color:#0f172a;margin:0 0 12px 0;">
        ${otp}
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#475569;line-height:22px;margin:0;">
        This code expires in 10 minutes. If you did not request this code, you can ignore this email.
      </p>
    `;
    const text =
      `Your Carry4Me sign-in code is ${otp}. This code expires in 10 minutes.`;

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject,
        html,
        text,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("send-email-login-otp resend failed", {
        status: resendResponse.status,
        resendError,
      });
      return jsonResponse({ error: "Failed to send email code" }, 502);
    }

    return jsonResponse({
      ok: true,
      expires_in_seconds: 600,
      cooldown_seconds: 60,
    });
  } catch (error) {
    console.error("send-email-login-otp error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
