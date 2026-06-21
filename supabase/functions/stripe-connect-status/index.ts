import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import {
  isMissingStripeAccountError,
  stripeErrorMessage,
} from "../_shared/stripe/errors.ts";
import {
  isTravelerStripeVerified,
  loadTravelerProfile,
  mapStripeVerificationStatus,
  type TravelerStripeProfile,
} from "../_shared/stripe/profiles.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

function unverifiedStatusResponse(profile: TravelerStripeProfile) {
  return jsonResponse({
    verified: false,
    stripe_account_id: profile.stripe_account_id,
    stripe_charges_enabled: profile.stripe_charges_enabled,
    stripe_payouts_enabled: profile.stripe_payouts_enabled,
    stripe_details_submitted: profile.stripe_details_submitted,
    stripe_verification_status: profile.stripe_verification_status ?? "not_started",
    phone_verified: profile.phone_verified,
    email_verified: profile.email_verified,
  });
}

async function resetStripeConnectProfile(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<TravelerStripeProfile | null> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      stripe_account_id: null,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_details_submitted: false,
      stripe_verification_status: "not_started",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("resetStripeConnectProfile failed", error.message);
    return null;
  }

  return loadTravelerProfile(supabaseAdmin, userId);
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
      return unverifiedStatusResponse(profile);
    }

    let account;
    try {
      account = await stripe.accounts.retrieve(profile.stripe_account_id);
    } catch (err) {
      if (isMissingStripeAccountError(err)) {
        console.warn(
          "stripe-connect-status stale account cleared",
          profile.stripe_account_id,
        );
        profile = await resetStripeConnectProfile(supabaseAdmin, user.id);
        if (!profile) {
          return jsonResponse({ error: "Failed to reset Stripe profile" }, 500);
        }
        return unverifiedStatusResponse(profile);
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

    const verificationStatus = mapStripeVerificationStatus(account);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled === true,
        stripe_payouts_enabled: account.payouts_enabled === true,
        stripe_details_submitted: account.details_submitted === true,
        stripe_verification_status: verificationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("stripe-connect-status update failed", updateError.message);
      return jsonResponse({ error: "Failed to update profile" }, 500);
    }

    const refreshed = {
      ...profile,
      stripe_account_id: account.id,
      stripe_charges_enabled: account.charges_enabled === true,
      stripe_payouts_enabled: account.payouts_enabled === true,
      stripe_details_submitted: account.details_submitted === true,
      stripe_verification_status: verificationStatus,
    };

    return jsonResponse({
      verified: isTravelerStripeVerified(refreshed),
      stripe_account_id: refreshed.stripe_account_id,
      stripe_charges_enabled: refreshed.stripe_charges_enabled,
      stripe_payouts_enabled: refreshed.stripe_payouts_enabled,
      stripe_details_submitted: refreshed.stripe_details_submitted,
      stripe_verification_status: refreshed.stripe_verification_status,
      phone_verified: refreshed.phone_verified,
      email_verified: refreshed.email_verified,
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("stripe-connect-status error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
