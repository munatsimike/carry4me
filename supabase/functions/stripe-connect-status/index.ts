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
  refreshStripeConnectAccountStatus,
} from "../_shared/stripe/connectAccount.ts";
import { loadTravelerProfile } from "../_shared/stripe/profiles.ts";
import { retryPendingTravelerTransfersForUser } from "../_shared/stripe/travelerTransfer.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const auth = await getAuthenticatedUser(req);
    const { user, supabaseAdmin } = auth;
    const stripe = getStripe();

    const loaded = await loadTravelerProfile(supabaseAdmin, user.id);
    if (!loaded) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    // Status checks only refresh the linked account — avoid email/metadata search
    // that can overwrite a verified account with an older duplicate.
    const profile = loaded.stripe_account_id
      ? await refreshStripeConnectAccountStatus(
        stripe,
        supabaseAdmin,
        loaded,
        user.id,
      )
      : await reconcileTravelerStripeConnectProfile(
        stripe,
        supabaseAdmin,
        user.id,
        loaded,
      );

    if (profile.stripe_account_id && profile.stripe_details_submitted) {
      await retryPendingTravelerTransfersForUser(stripe, supabaseAdmin, user.id);
    }

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
