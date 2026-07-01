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
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import {
  buildConnectStatusPayload,
  ensureStripeConnectAccountId,
  syncStripeConnectAccountToProfile,
  syncTravelerStripeConnectProfileFromStripe,
} from "../_shared/stripe/connectAccount.ts";
import {
  isTravelerStripeOnboardingComplete,
  isTravelerStripeVerified,
  loadTravelerProfile,
  resetStripeConnectProfile,
} from "../_shared/stripe/profiles.ts";

type RequestBody = {
  return_url?: string;
  refresh_url?: string;
};

async function createOnboardingLink(
  stripe: Stripe,
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<Stripe.AccountLink> {
  return stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
}

async function buildOnboardingResponse(
  stripe: ReturnType<typeof getStripe>,
  supabaseAdmin: Awaited<ReturnType<typeof getAuthenticatedUser>>["supabaseAdmin"],
  userId: string,
  userEmail: string | undefined,
  returnUrl: string,
  refreshUrl: string,
  allowRetry: boolean,
) {
  let profile = await loadTravelerProfile(supabaseAdmin, userId);
  if (!profile) {
    return jsonResponse({ error: "Profile not found" }, 404);
  }

  profile = await syncTravelerStripeConnectProfileFromStripe(
    stripe,
    supabaseAdmin,
    userId,
    profile,
  );

  if (
    isTravelerStripeVerified(profile) ||
    isTravelerStripeOnboardingComplete(profile)
  ) {
    return jsonResponse({
      ...buildConnectStatusPayload(profile),
      onboarding_url: null,
    });
  }

  let accountId = await ensureStripeConnectAccountId(
    stripe,
    supabaseAdmin,
    profile,
    userId,
    userEmail,
  );

  try {
    const accountLink = await createOnboardingLink(
      stripe,
      accountId,
      returnUrl,
      refreshUrl,
    );

    const account = await stripe.accounts.retrieve(accountId);
    await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);

    const refreshed = await loadTravelerProfile(supabaseAdmin, userId);
    if (!refreshed) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    return jsonResponse({
      ...buildConnectStatusPayload(refreshed),
      onboarding_url: accountLink.url,
    });
  } catch (err) {
    if (!allowRetry || !isStaleStripeConnectAccountError(err)) {
      throw err;
    }

    console.warn(
      "stripe-connect-onboarding stale account during link create — retrying",
      accountId,
      stripeErrorMessage(err),
    );
    await resetStripeConnectProfile(supabaseAdmin, userId);
    return buildOnboardingResponse(
      stripe,
      supabaseAdmin,
      userId,
      userEmail,
      returnUrl,
      refreshUrl,
      false,
    );
  }
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
      body = {};
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    const stripe = getStripe();

    const loaded = await loadTravelerProfile(supabaseAdmin, user.id);
    if (!loaded) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    if (!loaded.phone_verified) {
      return jsonResponse(
        {
          error: "Verify your phone number before Stripe onboarding",
          code: "PHONE_NOT_VERIFIED",
        },
        400,
      );
    }

    if (!loaded.email_verified) {
      return jsonResponse(
        {
          error: "Verify your email before Stripe onboarding",
          code: "EMAIL_NOT_VERIFIED",
        },
        400,
      );
    }

    const appUrl = Deno.env.get("APP_URL")?.trim() || "http://localhost:5173";
    const returnUrl = body.return_url?.trim() || `${appUrl}/requests?stripe=return`;
    const refreshUrl = body.refresh_url?.trim() || `${appUrl}/requests?stripe=refresh`;

    return await buildOnboardingResponse(
      stripe,
      supabaseAdmin,
      user.id,
      user.email,
      returnUrl,
      refreshUrl,
      true,
    );
  } catch (err) {
    if (isResponse(err)) return err;

    const message = stripeErrorMessage(err);
    console.error("stripe-connect-onboarding error", message, err);

    if (err instanceof Stripe.errors.StripeError) {
      if (isStaleStripeConnectAccountError(err)) {
        return jsonResponse(
          {
            error:
              "Your previous Stripe payout account was removed. Try again to start fresh setup.",
            code: "STRIPE_ACCOUNT_NOT_FOUND",
          },
          409,
        );
      }

      return jsonResponse(
        {
          error: message,
          code: err.code ?? "STRIPE_ERROR",
        },
        502,
      );
    }

    if (err && typeof err === "object" && "message" in err) {
      return jsonResponse(
        {
          error: String((err as { message: unknown }).message),
          code: "ONBOARDING_FAILED",
        },
        500,
      );
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
