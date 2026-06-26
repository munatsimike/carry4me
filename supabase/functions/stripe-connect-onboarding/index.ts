import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import {
  ensureStripeConnectAccountId,
  getStripeConnectClientState,
  syncStripeConnectAccountToProfile,
} from "../_shared/stripe/connectAccount.ts";
import {
  isTravelerStripeVerified,
  loadTravelerProfile,
} from "../_shared/stripe/profiles.ts";

type RequestBody = {
  return_url?: string;
  refresh_url?: string;
};

function connectStatusPayload(profile: NonNullable<Awaited<ReturnType<typeof loadTravelerProfile>>>) {
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
        ...connectStatusPayload(profile),
        onboarding_url: null,
      });
    }

    const appUrl = Deno.env.get("APP_URL")?.trim() || "http://localhost:5173";
    const returnUrl = body.return_url?.trim() || `${appUrl}/requests?stripe=return`;
    const refreshUrl = body.refresh_url?.trim() || `${appUrl}/requests?stripe=refresh`;

    const accountId = await ensureStripeConnectAccountId(
      stripe,
      supabaseAdmin,
      profile,
      user.id,
      user.email,
    );

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    const account = await stripe.accounts.retrieve(accountId);
    await syncStripeConnectAccountToProfile(supabaseAdmin, user.id, account);

    const refreshed = await loadTravelerProfile(supabaseAdmin, user.id);
    if (!refreshed) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    return jsonResponse({
      ...connectStatusPayload(refreshed),
      onboarding_url: accountLink.url,
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("stripe-connect-onboarding error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
