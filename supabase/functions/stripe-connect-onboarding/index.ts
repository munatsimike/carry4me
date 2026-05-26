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

type RequestBody = {
  return_url?: string;
  refresh_url?: string;
};

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: RequestBody = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    const stripe = getStripe();

    const profile = await loadTravelerProfile(supabaseAdmin, user.id);
    if (!profile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    if (!profile.phone_verified) {
      return jsonResponse(
        { error: "Verify your phone number before Stripe onboarding", code: "PHONE_NOT_VERIFIED" },
        400,
      );
    }

    if (!profile.email_verified) {
      return jsonResponse(
        { error: "Verify your email before Stripe onboarding", code: "EMAIL_NOT_VERIFIED" },
        400,
      );
    }

    if (isTravelerStripeVerified(profile)) {
      return jsonResponse({
        verified: true,
        onboarding_url: null,
        stripe_account_id: profile.stripe_account_id,
      });
    }

    const appUrl = Deno.env.get("APP_URL")?.trim() || "http://localhost:5173";
    const returnUrl = body.return_url?.trim() || `${appUrl}/requests?stripe=return`;
    const refreshUrl = body.refresh_url?.trim() || `${appUrl}/requests?stripe=refresh`;

    let accountId = profile.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email ?? user.email ?? undefined,
        metadata: { user_id: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });

      accountId = account.id;

      const { error: saveError } = await supabaseAdmin
        .from("profiles")
        .update({
          stripe_account_id: accountId,
          stripe_verification_status: "incomplete",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (saveError) {
        console.error("stripe-connect-onboarding save account failed", saveError.message);
        return jsonResponse({ error: "Failed to save Stripe account" }, 500);
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    const account = await stripe.accounts.retrieve(accountId);
    const verificationStatus = mapStripeVerificationStatus(account);

    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_charges_enabled: account.charges_enabled === true,
        stripe_payouts_enabled: account.payouts_enabled === true,
        stripe_details_submitted: account.details_submitted === true,
        stripe_verification_status: verificationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return jsonResponse({
      verified: false,
      onboarding_url: accountLink.url,
      stripe_account_id: accountId,
      stripe_verification_status: verificationStatus,
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("stripe-connect-onboarding error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
