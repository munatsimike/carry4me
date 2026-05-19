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

    const token = body.token?.trim();
    if (!token) {
      return jsonResponse({ error: "token is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
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
      return jsonResponse({ error: "Invalid or expired verification link" }, 404);
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("email_verification_tokens")
        .delete()
        .eq("token", token);

      return jsonResponse({ error: "Invalid or expired verification link" }, 404);
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

    return jsonResponse({ ok: true, verified: true });
  } catch (error) {
    console.error("verify-email error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
