import { handleCorsPreflight } from "../_shared/cors.ts";
import { calculatePaymentAmountsFromParcel } from "../_shared/stripe/amounts.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe, isStripeLiveMode } from "../_shared/stripe/client.ts";
import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import {
  fetchPaymentMethodConfigurationSummary,
  fetchStripeAccountDebugSummary,
  stripeKeyDebugSummary,
  type StripeAccountDebugSummary,
  type StripeKeyDebugSummary,
} from "../_shared/stripe/accountDiagnostics.ts";
import {
  retrieveAndLogPaymentIntent,
  type PaymentIntentDebugSummary,
} from "../_shared/stripe/paymentIntentDiagnostics.ts";
import { stripeErrorMessage } from "../_shared/stripe/errors.ts";

type RequestBody = {
  carry_request_id?: string;
};

type CarryRequestRow = {
  id: string;
  sender_user_id: string;
  traveler_user_id: string;
  status: string;
  payment_expires_at: string | null;
  parcel_snapshot: {
    price_per_kg?: number;
    weight_kg?: number;
    origin?: { country?: string };
  };
  stripe_payment_intent_id: string | null;
  payment_status: string | null;
};

function senderPaymentErrorMessage(err: unknown): string {
  const message = stripeErrorMessage(err).toLowerCase();

  if (message.includes("payment amount") || message.includes("minimum")) {
    return "This payment amount is too small to process. Contact support if this seems wrong.";
  }

  return "Could not start payment. Try again in a moment or contact support if this continues.";
}

function stripeSecretKeyPrefix(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";
  return key ? `${key.slice(0, 12)}…` : "missing";
}

async function buildStripeDiagnosticsBundle(
  stripe: Stripe,
  paymentIntentId: string,
  context: {
    carryRequestId: string;
    source: "created" | "reused";
  },
): Promise<{
  payment_intent_debug: PaymentIntentDebugSummary;
  stripe_key_debug: StripeKeyDebugSummary;
  stripe_account_debug: StripeAccountDebugSummary | null;
  payment_method_configurations: unknown;
}> {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";
  const stripeKeyDebug = stripeKeyDebugSummary(secretKey);
  const [paymentIntentDebug, stripeAccountDebug, paymentMethodConfigurations] =
    await Promise.all([
      retrieveAndLogPaymentIntent(stripe, paymentIntentId, {
        carryRequestId: context.carryRequestId,
        source: context.source,
        stripeSecretKeyPrefix: stripeKeyDebug.secret_key_prefix,
      }),
      fetchStripeAccountDebugSummary(secretKey),
      fetchPaymentMethodConfigurationSummary(secretKey),
    ]);

  console.info("create-payment-intent Stripe account diagnostics", {
    carryRequestId: context.carryRequestId,
    source: context.source,
    stripe_key_debug: stripeKeyDebug,
    stripe_account_debug: stripeAccountDebug,
    payment_method_configurations: paymentMethodConfigurations,
    connect_charge_type: paymentIntentDebug.connect_charge_type,
    connected_account_id: paymentIntentDebug.on_behalf_of,
  });

  return {
    payment_intent_debug: paymentIntentDebug,
    stripe_key_debug: stripeKeyDebug,
    stripe_account_debug: stripeAccountDebug,
    payment_method_configurations: paymentMethodConfigurations,
  };
}

function buildPaymentIntentCreateParams(
  amounts: {
    paymentAmount: number;
    currency: string;
  },
  metadata: Record<string, string>,
  description: string,
) {
  const amount = Math.round(amounts.paymentAmount);
  const currency = amounts.currency.toLowerCase();

  if (!Number.isInteger(amount) || amount < 50) {
    throw new Error("Payment amount must be an integer of at least 50 cents.");
  }

  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error(`Payment currency must be a lowercase ISO code, got "${currency}".`);
  }

  return {
    amount,
    currency,
    metadata,
    description,
    automatic_payment_methods: {
      enabled: true,
    },
  } as const;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const carryRequestId = body.carry_request_id?.trim();
    if (!carryRequestId) {
      return jsonResponse({ error: "carry_request_id is required" }, 400);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    const stripe = getStripe();
    const stripeLiveMode = isStripeLiveMode();

    const { data: carryRequest, error: loadError } = await supabaseAdmin
      .from("carry_requests")
      .select(
        "id, sender_user_id, traveler_user_id, status, payment_expires_at, parcel_snapshot, stripe_payment_intent_id, payment_status",
      )
      .eq("id", carryRequestId)
      .maybeSingle<CarryRequestRow>();

    if (loadError) {
      console.error("create-payment-intent load failed", loadError.message);
      return jsonResponse({ error: "Failed to load carry request" }, 500);
    }

    if (!carryRequest) {
      return jsonResponse({ error: "Carry request not found" }, 404);
    }

    if (carryRequest.sender_user_id !== user.id) {
      return jsonResponse({ error: "Only the sender can pay for this request" }, 403);
    }

    if (carryRequest.status !== "PENDING_PAYMENT") {
      return jsonResponse({ error: "Request is not awaiting payment" }, 400);
    }

    const pricePerKg = Number(carryRequest.parcel_snapshot?.price_per_kg ?? 0);
    const weightKg = Number(carryRequest.parcel_snapshot?.weight_kg ?? 0);
    const originCountry = carryRequest.parcel_snapshot?.origin?.country ?? null;

    if (!Number.isFinite(pricePerKg) || !Number.isFinite(weightKg) || weightKg <= 0) {
      return jsonResponse({ error: "Invalid parcel pricing on request" }, 400);
    }

    let amounts;
    try {
      amounts = calculatePaymentAmountsFromParcel(
        pricePerKg,
        weightKg,
        originCountry,
      );
    } catch (amountErr) {
      return jsonResponse(
        {
          error: amountErr instanceof Error
            ? amountErr.message
            : "Invalid payment amount",
        },
        400,
      );
    }

    const { data: paymentWindowSetting } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "payment_window_minutes")
      .maybeSingle<{ value: string }>();

    const paymentWindowMinutes = Math.max(
      1,
      Number.parseInt(paymentWindowSetting?.value ?? "10", 10) || 10,
    );
    const paymentExpiresAt = new Date(
      Date.now() + paymentWindowMinutes * 60 * 1000,
    ).toISOString();

    const extendPaymentWindow = async () => {
      const { error: extendError } = await supabaseAdmin
        .from("carry_requests")
        .update({
          payment_expires_at: paymentExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", carryRequestId)
        .eq("status", "PENDING_PAYMENT");

      if (extendError) {
        console.error(
          "create-payment-intent extend payment window failed",
          extendError.message,
        );
      }
    };

    const appUrl = Deno.env.get("APP_URL")?.trim() || "http://localhost:5173";
    const secretKeyPrefix = stripeSecretKeyPrefix();
    let diagnosticsBundle: Awaited<ReturnType<typeof buildStripeDiagnosticsBundle>> | null =
      null;

    // Reuse existing pending intent when possible (skip stale test intents after go-live).
    if (
      carryRequest.stripe_payment_intent_id &&
      (carryRequest.payment_status === "PENDING" ||
        carryRequest.payment_status === "FAILED")
    ) {
      try {
        const existing = await stripe.paymentIntents.retrieve(
          carryRequest.stripe_payment_intent_id,
        );

        const hasAutomaticPaymentMethods =
          existing.automatic_payment_methods?.enabled === true;

        const canReuse =
          existing.livemode === stripeLiveMode &&
          existing.currency === amounts.currency.toLowerCase() &&
          hasAutomaticPaymentMethods &&
          (existing.status === "requires_payment_method" ||
            existing.status === "requires_confirmation" ||
            existing.status === "requires_action");

        if (!canReuse) {
          console.info("create-payment-intent reuse skipped", {
            carryRequestId,
            paymentIntentId: existing.id,
            livemode: existing.livemode,
            expectedLivemode: stripeLiveMode,
            currency: existing.currency,
            expectedCurrency: amounts.currency.toLowerCase(),
            hasAutomaticPaymentMethods,
            payment_method_types: existing.payment_method_types ?? [],
            automatic_payment_methods: existing.automatic_payment_methods,
            application_fee_amount: existing.application_fee_amount,
            transfer_data: existing.transfer_data,
            on_behalf_of: existing.on_behalf_of,
            status: existing.status,
          });
        }

        if (canReuse && existing.client_secret) {
          await extendPaymentWindow();

          diagnosticsBundle = await buildStripeDiagnosticsBundle(
            stripe,
            existing.id,
            { carryRequestId, source: "reused" },
          );

          return jsonResponse({
            client_secret: existing.client_secret,
            payment_intent_id: existing.id,
            payment_amount: amounts.paymentAmount,
            payment_currency: amounts.currency,
            traveler_payout_amount: amounts.travelerPayoutAmount,
            platform_fee_amount: amounts.platformFeeAmount,
            ...diagnosticsBundle,
          });
        }
      } catch (retrieveErr) {
        console.warn(
          "create-payment-intent stale payment intent cleared",
          carryRequest.stripe_payment_intent_id,
          retrieveErr,
        );
      }
    }

    let paymentIntent;
    try {
      // Platform charge only — sender checkout never depends on traveler Connect.
      // Traveler payout is attempted after payment succeeds (webhook transfer).
      const createParams = buildPaymentIntentCreateParams(
        amounts,
        {
          carry_request_id: carryRequestId,
          sender_user_id: user.id,
          traveler_user_id: carryRequest.traveler_user_id,
          traveler_payout_amount: String(amounts.travelerPayoutAmount),
          platform_fee_amount: String(amounts.platformFeeAmount),
        },
        `Carry4Me carry request ${carryRequestId.slice(0, 8)}`,
      );

      console.info("create-payment-intent creating PaymentIntent", {
        carryRequestId,
        amount: createParams.amount,
        currency: createParams.currency,
        automatic_payment_methods: createParams.automatic_payment_methods,
        stripe_secret_key_prefix: secretKeyPrefix,
        stripe_live_mode: stripeLiveMode,
      });

      paymentIntent = await stripe.paymentIntents.create(createParams);
    } catch (stripeErr) {
      console.error(
        "create-payment-intent stripe create failed",
        stripeErrorMessage(stripeErr),
      );
      return jsonResponse(
        {
          error: senderPaymentErrorMessage(stripeErr),
          code: "STRIPE_PAYMENT_INTENT_FAILED",
        },
        502,
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("carry_requests")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: "PENDING",
        payment_amount: amounts.paymentAmount,
        payment_currency: amounts.currency,
        platform_fee_amount: amounts.platformFeeAmount,
        traveler_payout_amount: amounts.travelerPayoutAmount,
        payment_expires_at: paymentExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carryRequestId);

    if (updateError) {
      console.error("create-payment-intent update failed", updateError.message);
      return jsonResponse({ error: "Failed to store payment details" }, 500);
    }

    console.info("create-payment-intent ok", {
      carryRequestId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    diagnosticsBundle = await buildStripeDiagnosticsBundle(
      stripe,
      paymentIntent.id,
      { carryRequestId, source: "created" },
    );

    return jsonResponse({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      payment_amount: amounts.paymentAmount,
      payment_currency: amounts.currency,
      traveler_payout_amount: amounts.travelerPayoutAmount,
      platform_fee_amount: amounts.platformFeeAmount,
      return_url: appUrl,
      ...diagnosticsBundle,
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("create-payment-intent error", stripeErrorMessage(err));
    return jsonResponse(
      {
        error: senderPaymentErrorMessage(err),
        code: "PAYMENT_INTENT_ERROR",
      },
      500,
    );
  }
});
