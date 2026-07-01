import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { jsonResponse, requireEnv } from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import {
  findProfileIdByStripeAccountId,
  syncStripeConnectAccountToProfile,
} from "../_shared/stripe/connectAccount.ts";
import { transferTravelerPayoutForPayment } from "../_shared/stripe/travelerTransfer.ts";
import { notifyTravelerBankPayoutPaid } from "../_shared/stripe/travelerBankPayoutNotification.ts";

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
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(supabaseAdmin, account);
        break;
      }
      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutPaid(supabaseAdmin, payout, event.account);
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

  const { data: carryRequest, error: loadError } = await supabaseAdmin
    .from("carry_requests")
    .select(
      "id, traveler_user_id, traveler_payout_amount, payment_currency, stripe_payment_intent_id",
    )
    .eq("id", carryRequestId)
    .maybeSingle();

  if (loadError || !carryRequest) {
    console.error("stripe-webhook carry request load failed", loadError?.message);
    throw loadError ?? new Error("Carry request not found");
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

  const stripe = getStripe();
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
    console.warn("stripe-webhook traveler payout deferred", {
      carryRequestId,
      reason: transferResult.reason,
    });
  } else {
    console.info("stripe-webhook traveler payout transferred", {
      carryRequestId,
      transferId: transferResult.transferId,
    });
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
    travelerTransfer: transferResult.ok ? "sent" : transferResult.reason,
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

async function handleAccountUpdated(
  supabaseAdmin: ReturnType<typeof createClient>,
  account: Stripe.Account,
) {
  const userId = await findProfileIdByStripeAccountId(supabaseAdmin, account.id);
  if (!userId) {
    console.info("stripe-webhook account.updated ignored unknown account", account.id);
    return;
  }

  await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);

  console.info("stripe-webhook account.updated synced", {
    userId,
    accountId: account.id,
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
  });
}

async function handlePayoutPaid(
  supabaseAdmin: ReturnType<typeof createClient>,
  payout: Stripe.Payout,
  connectedAccountId: string | null | undefined,
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const result = await notifyTravelerBankPayoutPaid(supabaseAdmin, {
    payout,
    connectedAccountId,
    resendApiKey,
  });

  console.info("stripe-webhook payout.paid processed", {
    payoutId: payout.id,
    connectedAccountId,
    ...result,
  });
}
