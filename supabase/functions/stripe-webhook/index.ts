import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { jsonResponse, requireEnv } from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";

// TODO: handle charge.refunded — restore carry request / notify parties
// TODO: handle charge.dispute.created — flag request and alert ops

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const stripe = getStripe();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();

  if (!webhookSecret) {
    console.error("stripe-webhook: STRIPE_WEBHOOK_SECRET is not set");
    return jsonResponse({ error: "Webhook not configured" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "Missing stripe-signature" }, 400);
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("stripe-webhook signature verification failed", err);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  const supabaseAdmin = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(supabaseAdmin, paymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(supabaseAdmin, paymentIntent);
        break;
      }
      default:
        console.info("stripe-webhook ignored event", event.type);
    }

    return jsonResponse({ received: true });
  } catch (err) {
    console.error("stripe-webhook handler error", err);
    return jsonResponse({ error: "Webhook handler failed" }, 500);
  }
});

async function handlePaymentIntentSucceeded(
  supabaseAdmin: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent,
) {
  const carryRequestId = paymentIntent.metadata?.carry_request_id?.trim();
  if (!carryRequestId) {
    console.warn("payment_intent.succeeded missing carry_request_id metadata");
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from("carry_requests")
    .update({
      payment_status: "SUCCEEDED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", carryRequestId)
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (updateError) {
    console.error("stripe-webhook payment update failed", updateError.message);
    throw updateError;
  }

  // Reuses the same transition as perform_carry_request_action PAY (RPC).
  const { data: finalizeResult, error: finalizeError } = await supabaseAdmin.rpc(
    "finalize_carry_request_payment",
    {
      p_request_id: carryRequestId,
      p_stripe_payment_intent_id: paymentIntent.id,
    },
  );

  if (finalizeError) {
    console.error("finalize_carry_request_payment failed", finalizeError.message);
    throw finalizeError;
  }

  console.info("payment_intent.succeeded processed", {
    carryRequestId,
    paymentIntentId: paymentIntent.id,
    finalizeResult,
  });
}

async function handlePaymentIntentFailed(
  supabaseAdmin: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent,
) {
  const carryRequestId = paymentIntent.metadata?.carry_request_id?.trim();
  if (!carryRequestId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("carry_requests")
    .update({
      payment_status: "FAILED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", carryRequestId)
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("stripe-webhook failed payment update", error.message);
    throw error;
  }

  console.info("payment_intent.payment_failed processed", {
    carryRequestId,
    paymentIntentId: paymentIntent.id,
  });
}
