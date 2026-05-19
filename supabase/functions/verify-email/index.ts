import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type RequestBody = {
  token?: string;
};

type TokenRow = {
  token: string;
  user_id: string;
  expires_at: string;
};

type ProfileVerificationRow = {
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
      return jsonResponse({ ok: false, verified: false, error: "invalid_body" }, 200);
    }

    const token = body.token?.trim();
    if (!token) {
      return jsonResponse({ ok: false, verified: false, error: "token_required" }, 200);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("token, user_id, expires_at")
      .eq("token", token)
      .maybeSingle<TokenRow>();

    if (tokenError) {
      console.error("Failed to load verification token:", tokenError);
      return jsonResponse({ error: "Failed to verify email" }, 500);
    }

    if (!tokenRow) {
      const alreadyVerified = await resolveAlreadyVerifiedUser(
        supabaseUrl,
        supabaseAnonKey,
        req.headers.get("Authorization"),
        supabaseAdmin,
      );

      if (alreadyVerified) {
        return jsonResponse({
          ok: true,
          verified: true,
          alreadyVerified: true,
        });
      }

      return jsonResponse({
        ok: false,
        verified: false,
        error: "link_already_used",
      }, 200);
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("email_verification_tokens")
        .delete()
        .eq("token", token);

      const alreadyVerified = await isProfileEmailVerified(
        supabaseAdmin,
        tokenRow.user_id,
      );

      if (alreadyVerified) {
        return jsonResponse({
          ok: true,
          verified: true,
          alreadyVerified: true,
        });
      }

      return jsonResponse({
        ok: false,
        verified: false,
        error: "link_expired",
      }, 200);
    }

    const alreadyVerified = await isProfileEmailVerified(
      supabaseAdmin,
      tokenRow.user_id,
    );

    if (alreadyVerified) {
      await supabaseAdmin
        .from("email_verification_tokens")
        .delete()
        .eq("user_id", tokenRow.user_id);

      return jsonResponse({
        ok: true,
        verified: true,
        alreadyVerified: true,
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", tokenRow.user_id);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return jsonResponse({ error: "Failed to verify email" }, 500);
    }

    await supabaseAdmin
      .from("email_verification_tokens")
      .delete()
      .eq("user_id", tokenRow.user_id);

    return jsonResponse({ ok: true, verified: true, alreadyVerified: false });
  } catch (error) {
    console.error("verify-email error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function isProfileEmailVerified(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email_verified")
    .eq("id", userId)
    .maybeSingle<ProfileVerificationRow>();

  return profile?.email_verified === true;
}

async function resolveAlreadyVerifiedUser(
  supabaseUrl: string,
  supabaseAnonKey: string | undefined,
  authHeader: string | null,
  supabaseAdmin: ReturnType<typeof createClient>,
) {
  if (!authHeader || !supabaseAnonKey) {
    return false;
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) {
    return false;
  }

  return isProfileEmailVerified(supabaseAdmin, authData.user.id);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
