import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight } from "../_shared/cors.ts";

type RequestBody = {
  email?: string;
  otp?: string;
};

type OtpRow = {
  id: string;
  otp_hash: string;
  otp_salt: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
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

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}

async function hashOtp(saltHex: string, otp: string): Promise<string> {
  return await sha256Hex(`${saltHex}:${otp}`);
}

function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function ensureUserExists(supabaseAdmin: ReturnType<typeof createClient>, email: string) {
  const adminAuth = supabaseAdmin.auth.admin as unknown as {
    getUserByEmail?: (email: string) => Promise<{ data?: { user?: { id: string } | null }; error?: unknown }>;
    createUser: (payload: { email: string; email_confirm: boolean }) => Promise<{
      data?: { user?: { id: string } | null };
      error?: unknown;
    }>;
  };

  if (typeof adminAuth.getUserByEmail === "function") {
    const { data, error } = await adminAuth.getUserByEmail(email);
    if (!error && data?.user?.id) {
      return data.user.id;
    }
  }

  const { data: createdData, error: createError } = await adminAuth.createUser({
    email,
    email_confirm: true,
  });

  if (createError) {
    // If user already exists race-condition-wise, continue without throwing here.
    const message = createError instanceof Error
      ? createError.message.toLowerCase()
      : String(createError).toLowerCase();
    if (!message.includes("already") && !message.includes("exists")) {
      throw createError;
    }
  }

  return createdData?.user?.id ?? null;
}

async function createMagicLink(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  redirectTo: string,
): Promise<string> {
  const adminAuth = supabaseAdmin.auth.admin as unknown as {
    generateLink: (payload: {
      type: "magiclink";
      email: string;
      options?: { redirectTo?: string };
    }) => Promise<{
      data?: {
        properties?: { action_link?: string | null };
        action_link?: string | null;
      };
      error?: unknown;
    }>;
  };

  const { data, error } = await adminAuth.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) {
    throw error;
  }

  const actionLink = data?.properties?.action_link ?? data?.action_link ?? null;
  if (!actionLink) {
    throw new Error("Failed to generate sign-in link.");
  }

  return actionLink;
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

    const email = normalizeEmail(body.email ?? "");
    const otp = (body.otp ?? "").trim();

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: "A valid email is required" }, 400);
    }

    if (!/^\d{6}$/.test(otp)) {
      return jsonResponse({ error: "Enter the 6-digit email code." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = Deno.env.get("APP_URL")?.trim() || "https://carry4me.uk";
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const nowIso = new Date().toISOString();

    const { data: otpRow, error: rowError } = await supabaseAdmin
      .from("email_login_otps")
      .select("id, otp_hash, otp_salt, expires_at, attempts, max_attempts")
      .eq("email", email)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<OtpRow>();

    if (rowError) {
      console.error("verify-email-login-otp row load failed", rowError);
      return jsonResponse({ error: "Could not verify email code" }, 500);
    }

    if (!otpRow) {
      return jsonResponse({ error: "No active code found. Request a new code." }, 400);
    }

    if (new Date(otpRow.expires_at).getTime() <= Date.now()) {
      return jsonResponse({ error: "Code has expired. Request a new one." }, 400);
    }

    if (otpRow.attempts >= otpRow.max_attempts) {
      return jsonResponse(
        { error: "Maximum attempts reached. Request a new code." },
        400,
      );
    }

    const providedHash = await hashOtp(otpRow.otp_salt, otp);
    const isValid = safeEquals(providedHash, otpRow.otp_hash);

    if (!isValid) {
      const nextAttempts = otpRow.attempts + 1;
      const { error: attemptError } = await supabaseAdmin
        .from("email_login_otps")
        .update({
          attempts: nextAttempts,
          updated_at: nowIso,
        })
        .eq("id", otpRow.id);

      if (attemptError) {
        console.error("verify-email-login-otp attempts update failed", attemptError);
      }

      const remaining = Math.max(0, otpRow.max_attempts - nextAttempts);
      return jsonResponse(
        {
          error: remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Maximum attempts reached. Request a new code.",
        },
        400,
      );
    }

    const { error: markUsedError } = await supabaseAdmin
      .from("email_login_otps")
      .update({
        used_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", otpRow.id);

    if (markUsedError) {
      console.error("verify-email-login-otp mark used failed", markUsedError);
      return jsonResponse({ error: "Could not finalize sign-in" }, 500);
    }

    try {
      await ensureUserExists(supabaseAdmin, email);
    } catch (ensureUserError) {
      console.error("verify-email-login-otp ensure user failed", ensureUserError);
      return jsonResponse({ error: "Could not prepare account for sign-in" }, 500);
    }

    let actionLink: string;
    try {
      actionLink = await createMagicLink(
        supabaseAdmin,
        email,
        `${appUrl}/dashboard`,
      );
    } catch (linkError) {
      console.error("verify-email-login-otp magic link failed", linkError);
      return jsonResponse({ error: "Could not complete sign-in" }, 500);
    }

    return jsonResponse({
      ok: true,
      action_link: actionLink,
    });
  } catch (error) {
    console.error("verify-email-login-otp error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
