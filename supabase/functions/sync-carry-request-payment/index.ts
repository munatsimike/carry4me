import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import { transferTravelerPayoutForPayment } from "../_shared/stripe/travelerTransfer.ts";

type RequestBody = {
  carry_request_id?: string;
};

/** After Stripe.js confirms payment on the client, sync status before perform_carry_request_action PAY. */
Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = (await req.json()) as RequestBody;
    const carryRequestId = body.carry_request_id?.trim();
    if (!carryRequestId) {
      return jsonResponse({ error: "carry_request_id is required" }, 400);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    const stripe = getStripe();

    const { data: carryRequest, error: loadError } = await supabaseAdmin
      .from("carry_requests")
      .select(
        "id, sender_user_id, traveler_user_id, stripe_payment_intent_id, payment_status, status, traveler_payout_amount, payment_currency",
      )
      .eq("id", carryRequestId)
      .maybeSingle();

    if (loadError || !carryRequest) {
      return jsonResponse({ error: "Carry request not found" }, 404);
    }

    if (carryRequest.sender_user_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (!carryRequest.stripe_payment_intent_id) {
      return jsonResponse({ error: "No payment intent for this request" }, 400);
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      carryRequest.stripe_payment_intent_id,
      { expand: ["latest_charge"] },
    );

    if (paymentIntent.status === "succeeded") {
      await supabaseAdmin
        .from("carry_requests")
        .update({
          payment_status: "SUCCEEDED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", carryRequestId);

      const transferResult = await transferTravelerPayoutForPayment(
        stripe,
        supabaseAdmin,
        {
          carryRequestId,
          travelerUserId: carryRequest.traveler_user_id,
          paymentIntent,
          travelerPayoutAmount: Number(carryRequest.traveler_payout_amount ?? 0),
          paymentCurrency: carryRequest.payment_currency ?? paymentIntent.currency,
        },
      );

      if (!transferResult.ok) {
        console.warn("sync-carry-request-payment traveler payout deferred", {
          carryRequestId,
          reason: transferResult.reason,
        });
      }

      return jsonResponse({
        ok: true,
        payment_status: "SUCCEEDED",
        stripe_status: paymentIntent.status,
      });
    }

    if (
      paymentIntent.status === "requires_payment_method" ||
      paymentIntent.status === "canceled"
    ) {
      await supabaseAdmin
        .from("carry_requests")
        .update({
          payment_status: "FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", carryRequestId);
    }

    const retryMessage =
      paymentIntent.status === "processing"
        ? "Your payment is still being confirmed. Wait a few seconds, then tap Pay now again."
        : "We couldn't confirm your payment yet. Wait a moment and try again.";

    return jsonResponse({
      ok: false,
      payment_status: carryRequest.payment_status,
      stripe_status: paymentIntent.status,
      error: retryMessage,
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("sync-carry-request-payment error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
