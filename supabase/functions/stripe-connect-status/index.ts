import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import {
  isTravelerStripeVerified,
  loadTravelerProfile,
  mapStripeVerificationStatus,
} from "../_shared/stripe/profiles.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    const stripe = getStripe();

    const profile = await loadTravelerProfile(supabaseAdmin, user.id);
    if (!profile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    if (!profile.stripe_account_id) {
      return jsonResponse({
        verified: false,
        stripe_account_id: null,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_details_submitted: false,
        stripe_verification_status: profile.stripe_verification_status ?? "not_started",
        phone_verified: profile.phone_verified,
        email_verified: profile.email_verified,
      });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
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
