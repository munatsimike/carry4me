import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import {
  isStaleStripeConnectAccountError,
  stripeErrorMessage,
} from "../_shared/stripe/errors.ts";
import {
  getStripeConnectClientState,
  refreshStripeConnectAccountStatus,
} from "../_shared/stripe/connectAccount.ts";
import {
  isTravelerStripeVerified,
  loadTravelerProfile,
  resetStripeConnectProfile,
  type TravelerStripeProfile,
} from "../_shared/stripe/profiles.ts";

function connectStatusPayload(profile: TravelerStripeProfile) {
  return {
    verified: isTravelerStripeVerified(profile),
    connect_state: getStripeConnectClientState(profile),
    stripe_account_id: profile.stripe_account_id,
    stripe_charges_enabled: profile.stripe_charges_enabled,
    stripe_payouts_enabled: profile.stripe_payouts_enabled,
    stripe_details_submitted: profile.stripe_details_submitted,
    stripe_verification_status: profile.stripe_verification_status ?? "not_started",
    phone_verified: profile.phone_verified,
    email_verified: profile.email_verified,
  };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    const stripe = getStripe();

    let profile = await loadTravelerProfile(supabaseAdmin, user.id);
    if (!profile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    if (!profile.stripe_account_id) {
      return jsonResponse(connectStatusPayload(profile));
    }

    try {
      profile = await refreshStripeConnectAccountStatus(
        stripe,
        supabaseAdmin,
        profile,
        user.id,
      );
    } catch (err) {
      if (isStaleStripeConnectAccountError(err)) {
        console.warn(
          "stripe-connect-status stale account cleared",
          profile.stripe_account_id,
          stripeErrorMessage(err),
        );
        const resetProfile = await resetStripeConnectProfile(supabaseAdmin, user.id);
        if (!resetProfile) {
          return jsonResponse({ error: "Failed to reset Stripe profile" }, 500);
        }
        return jsonResponse(connectStatusPayload(resetProfile));
      }

      console.error(
        "stripe-connect-status retrieve failed",
        stripeErrorMessage(err),
      );
      return jsonResponse(
        {
          error: "Could not verify Stripe account status. Try again in a moment.",
          code: "STRIPE_ACCOUNT_LOOKUP_FAILED",
        },
        502,
      );
    }

    return jsonResponse(connectStatusPayload(profile));
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("stripe-connect-status error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
