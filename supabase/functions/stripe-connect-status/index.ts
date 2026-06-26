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
import { loadTravelerProfile } from "../_shared/stripe/profiles.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
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
    return jsonResponse(
      {
        error: "Could not verify Stripe account status. Try again in a moment.",
        code: "STRIPE_ACCOUNT_LOOKUP_FAILED",
      },
      502,
    );
  }
});
