import { handleCorsPreflight } from "../_shared/cors.ts";
import { calculatePaymentAmountsFromParcel } from "../_shared/stripe/amounts.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe, isStripeLiveMode } from "../_shared/stripe/client.ts";
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
          existing.currency === amounts.currency &&
          hasAutomaticPaymentMethods &&
          (existing.status === "requires_payment_method" ||
            existing.status === "requires_confirmation" ||
            existing.status === "requires_action");

        if (canReuse && existing.client_secret) {
          await extendPaymentWindow();

          return jsonResponse({
            client_secret: existing.client_secret,
            payment_intent_id: existing.id,
            payment_amount: amounts.paymentAmount,
            payment_currency: amounts.currency,
            traveler_payout_amount: amounts.travelerPayoutAmount,
            platform_fee_amount: amounts.platformFeeAmount,
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
      paymentIntent = await stripe.paymentIntents.create({
        amount: amounts.paymentAmount,
        currency: amounts.currency,
        metadata: {
          carry_request_id: carryRequestId,
          sender_user_id: user.id,
          traveler_user_id: carryRequest.traveler_user_id,
          traveler_payout_amount: String(amounts.travelerPayoutAmount),
          platform_fee_amount: String(amounts.platformFeeAmount),
        },
        description: `Carry4Me carry request ${carryRequestId.slice(0, 8)}`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });
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
      amount: amounts.paymentAmount,
      currency: amounts.currency,
    });

    return jsonResponse({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      payment_amount: amounts.paymentAmount,
      payment_currency: amounts.currency,
      traveler_payout_amount: amounts.travelerPayoutAmount,
      platform_fee_amount: amounts.platformFeeAmount,
      return_url: appUrl,
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
