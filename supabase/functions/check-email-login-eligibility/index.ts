import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight } from "../_shared/cors.ts";

type ProfileEligibilityRow = {
  id: string;
  full_name: string | null;
  country_code: string | null;
  city: string | null;
  phone_number: string | null;
  email: string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
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

function hasCompletedProfile(profile: ProfileEligibilityRow | null): boolean {
  if (!profile) return false;

  const requiredFields = [
    profile.full_name,
    profile.country_code,
    profile.city,
    profile.phone_number,
    profile.email,
  ];

  const hasAllRequiredText = requiredFields.every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return (
    hasAllRequiredText &&
    profile.email_verified === true &&
    profile.phone_verified === true
  );
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const email = normalizeEmail(body.email ?? "");
    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: "A valid email is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, country_code, city, phone_number, email, email_verified, phone_verified",
      )
      .ilike("email", email)
      .maybeSingle<ProfileEligibilityRow>();

    if (profileError) {
      console.error(
        "check-email-login-eligibility profile load failed",
        profileError,
      );
      return jsonResponse({ error: "Could not verify eligibility" }, 500);
    }

    if (!profile || !hasCompletedProfile(profile)) {
      return jsonResponse(
        { error: "Account not found or incomplete. Sign in with Phone OTP." },
        404,
      );
    }

    const profileEmail = normalizeEmail(profile.email ?? "");
    if (profileEmail !== email) {
      return jsonResponse(
        { error: "Account not found or incomplete. Sign in with Phone OTP." },
        403,
      );
    }

    const { data: authData, error: authUserError } = await supabaseAdmin.auth
      .admin.getUserById(profile.id);

    if (authUserError || !authData.user) {
      console.error(
        "check-email-login-eligibility auth user load failed",
        authUserError,
      );
      return jsonResponse({ error: "Could not verify eligibility" }, 500);
    }

    const authEmail = authData.user.email
      ? normalizeEmail(authData.user.email)
      : null;

    if (authEmail && authEmail !== email) {
      return jsonResponse(
        { error: "Account not found or incomplete. Sign in with Phone OTP." },
        403,
      );
    }

    if (!authEmail && profileEmail) {
      const { error: updateError } = await supabaseAdmin.auth.admin
        .updateUserById(profile.id, {
          email: profileEmail,
          email_confirm: true,
        });

      if (updateError) {
        console.error(
          "check-email-login-eligibility auth email sync failed",
          updateError,
        );
        return jsonResponse({ error: "Could not verify eligibility" }, 500);
      }
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("check-email-login-eligibility error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
