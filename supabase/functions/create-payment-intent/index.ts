import { handleCorsPreflight } from "../_shared/cors.ts";
import { calculatePaymentAmountsFromParcel } from "../_shared/stripe/amounts.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import { isTravelerStripeVerified, loadTravelerProfile } from "../_shared/stripe/profiles.ts";

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

    if (
      carryRequest.payment_expires_at &&
      new Date(carryRequest.payment_expires_at).getTime() <= Date.now()
    ) {
      const { error: expireError } = await supabaseAdmin.rpc(
        "expire_carry_request",
        { p_request_id: carryRequestId },
      );
      if (expireError) {
        console.error("expire_carry_request failed", expireError.message);
      }
      return jsonResponse({ error: "Payment window has expired" }, 400);
    }

    const travelerProfile = await loadTravelerProfile(
      supabaseAdmin,
      carryRequest.traveler_user_id,
    );

    if (!travelerProfile || !isTravelerStripeVerified(travelerProfile)) {
      return jsonResponse(
        { error: "Traveler has not completed payout verification" },
        400,
      );
    }

    const pricePerKg = Number(carryRequest.parcel_snapshot?.price_per_kg ?? 0);
    const weightKg = Number(carryRequest.parcel_snapshot?.weight_kg ?? 0);
    const originCountry = carryRequest.parcel_snapshot?.origin?.country ?? null;

    if (!Number.isFinite(pricePerKg) || !Number.isFinite(weightKg) || weightKg <= 0) {
      return jsonResponse({ error: "Invalid parcel pricing on request" }, 400);
    }

    const amounts = calculatePaymentAmountsFromParcel(
      pricePerKg,
      weightKg,
      originCountry,
    );

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

    // Reuse existing pending intent when possible.
    if (
      carryRequest.stripe_payment_intent_id &&
      (carryRequest.payment_status === "PENDING" ||
        carryRequest.payment_status === "FAILED")
    ) {
      const existing = await stripe.paymentIntents.retrieve(
        carryRequest.stripe_payment_intent_id,
      );

      if (
        existing.status === "requires_payment_method" ||
        existing.status === "requires_confirmation" ||
        existing.status === "requires_action"
      ) {
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
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amounts.paymentAmount,
      currency: amounts.currency,
      application_fee_amount: amounts.platformFeeAmount,
      transfer_data: {
        destination: travelerProfile.stripe_account_id!,
      },
      metadata: {
        carry_request_id: carryRequestId,
        sender_user_id: user.id,
        traveler_user_id: carryRequest.traveler_user_id,
      },
      description: `Carry4Me carry request ${carryRequestId.slice(0, 8)}`,
      automatic_payment_methods: { enabled: true },
    });

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
    console.error("create-payment-intent error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
