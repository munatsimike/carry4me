import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import { stripeErrorMessage } from "../_shared/stripe/errors.ts";
import {
  buildConnectStatusPayload,
  reconcileTravelerStripeConnectProfile,
} from "../_shared/stripe/connectAccount.ts";
import {
  loadTravelerProfile,
  resetStripeConnectProfile,
} from "../_shared/stripe/profiles.ts";
import type { User } from "npm:@supabase/supabase-js@2";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  let user: User | null = null;
  let supabaseAdmin: SupabaseClient | null = null;

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const auth = await getAuthenticatedUser(req);
    user = auth.user;
    supabaseAdmin = auth.supabaseAdmin;
    const stripe = getStripe();

    const loaded = await loadTravelerProfile(supabaseAdmin, user.id);
    if (!loaded) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    const profile = await reconcileTravelerStripeConnectProfile(
      stripe,
      supabaseAdmin,
      user.id,
      loaded,
    );

    return jsonResponse(buildConnectStatusPayload(profile));
  } catch (err) {
    if (isResponse(err)) return err;

    console.error(
      "stripe-connect-status error",
      stripeErrorMessage(err),
      err,
    );

    if (user && supabaseAdmin) {
      try {
        await resetStripeConnectProfile(supabaseAdmin, user.id);
        const cleared = await loadTravelerProfile(supabaseAdmin, user.id);
        if (cleared) {
          return jsonResponse(buildConnectStatusPayload(cleared));
        }
      } catch (fallbackErr) {
        console.error(
          "stripe-connect-status fallback clear failed",
          stripeErrorMessage(fallbackErr),
        );
      }
    }

    return jsonResponse(
      {
        error: "Could not verify Stripe account status. Try again in a moment.",
        code: "STRIPE_ACCOUNT_LOOKUP_FAILED",
      },
      502,
    );
  }
});
