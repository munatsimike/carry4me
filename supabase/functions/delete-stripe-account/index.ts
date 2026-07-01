import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  isResponse,
  jsonResponse,
  requireEnv,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import {
  isMissingStripeAccountError,
  stripeErrorMessage,
} from "../_shared/stripe/errors.ts";
import { buildConnectStatusPayload } from "../_shared/stripe/connectAccount.ts";
import { resetStripeConnectProfileByAccountId } from "../_shared/stripe/profiles.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

type RequestBody = {
  stripe_account_id?: string;
  account_id?: string;
};

function readAccountId(body: RequestBody): string | null {
  const value = body.stripe_account_id?.trim() || body.account_id?.trim();
  if (!value) return null;
  if (!value.startsWith("acct_")) return null;
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: RequestBody = {};
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const accountId = readAccountId(body);
    if (!accountId) {
      return jsonResponse(
        {
          error: "stripe_account_id is required and must start with acct_",
          code: "INVALID_ACCOUNT_ID",
        },
        400,
      );
    }

    const stripe = getStripe();
    let deleted = false;

    try {
      const result = await stripe.accounts.del(accountId);
      deleted = result.deleted === true;
    } catch (err) {
      if (!isMissingStripeAccountError(err)) {
        throw err;
      }

      console.warn(
        "delete-stripe-account: Stripe account already missing",
        accountId,
      );
      deleted = true;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const refreshed = await resetStripeConnectProfileByAccountId(
      supabaseAdmin,
      accountId,
    );

    return jsonResponse({
      ok: true,
      deleted,
      stripe_account_id: accountId,
      profile_cleared: refreshed !== null,
      ...(refreshed ? buildConnectStatusPayload(refreshed) : {}),
    });
  } catch (err) {
    if (isResponse(err)) return err;

    const message = stripeErrorMessage(err);
    console.error("delete-stripe-account error", message, err);

    if (err instanceof Stripe.errors.StripeError) {
      return jsonResponse(
        {
          error: message,
          code: err.code ?? "STRIPE_ERROR",
        },
        502,
      );
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
