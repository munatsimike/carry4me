import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { jsonResponse, requireEnv } from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import {
  constructVerifiedStripeEvent,
  getStripeWebhookSecrets,
} from "../_shared/stripe/webhookVerification.ts";
import {
  findProfileIdByStripeAccountId,
  syncStripeConnectAccountToProfile,
} from "../_shared/stripe/connectAccount.ts";
import { retryPendingTravelerTransfersForUser } from "../_shared/stripe/travelerTransfer.ts";
import { notifyTravelerBankPayoutPaid } from "../_shared/stripe/travelerBankPayoutNotification.ts";
import { processCarryRequestEventEmails } from "../_shared/emailQueueProcessor.ts";
import {
  classifyRefundStatus,
  findCarryRequestByPaymentIntentId,
  paymentIntentIdFromStripeRef,
  type CarryRequestPaymentRow,
} from "../_shared/stripe/carryRequestPaymentLookup.ts";
import { sendAdminPaymentAlertEmail } from "../_shared/emails/adminPaymentAlertEmail.ts";

type SupabaseAdmin = ReturnType<typeof createClient>;

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const stripe = getStripe();
  const webhookSecrets = getStripeWebhookSecrets();

  if (webhookSecrets.length === 0) {
    console.error(
      "stripe-webhook: set STRIPE_WEBHOOK_SECRET and/or STRIPE_CONNECT_WEBHOOK_SECRET",
    );
    return jsonResponse({ error: "Webhook not configured" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "Missing stripe-signature" }, 400);
  }

  const body = await req.text();

  const event = await constructVerifiedStripeEvent(stripe, body, signature);
  if (!event) {
    console.error("stripe-webhook signature verification failed for all configured secrets");
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
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(supabaseAdmin, charge);
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(supabaseAdmin, dispute);
        break;
      }
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeClosed(supabaseAdmin, dispute);
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
  supabaseAdmin: SupabaseAdmin,
  paymentIntent: Stripe.PaymentIntent,
) {
  const carryRequestId = paymentIntent.metadata?.carry_request_id?.trim();
  if (!carryRequestId) {
    console.warn("payment_intent.succeeded missing carry_request_id metadata");
    return;
  }

  const { data: carryRequest, error: loadError } = await supabaseAdmin
    .from("carry_requests")
    .select("id, stripe_payment_intent_id")
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

  // Traveler Connect transfer waits until delivery OTP is verified.
  // Funds remain on the platform account until then.

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

  const finalizeOk =
    typeof finalizeResult === "object" &&
    finalizeResult !== null &&
    (finalizeResult as { ok?: boolean }).ok === true;

  if (finalizeOk) {
    const emailOutcome = await processCarryRequestEventEmails(
      supabaseAdmin,
      carryRequestId,
      "PAYMENT_COMPLETED",
      Deno.env.get("RESEND_API_KEY"),
    );

    console.info("payment_intent.succeeded emails processed", {
      carryRequestId,
      processed: emailOutcome.processed,
      queued: emailOutcome.results.length,
    });
  }

  console.info("payment_intent.succeeded processed", {
    carryRequestId,
    paymentIntentId: paymentIntent.id,
    finalizeResult,
  });
}

async function handlePaymentIntentFailed(
  supabaseAdmin: SupabaseAdmin,
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

/**
 * Reconcile Stripe refunds onto carry_requests.
 * Covers cancel-flow refunds (idempotent) and Dashboard / external refunds.
 */
async function handleChargeRefunded(
  supabaseAdmin: SupabaseAdmin,
  charge: Stripe.Charge,
) {
  const paymentIntentId = paymentIntentIdFromStripeRef(charge.payment_intent);
  if (!paymentIntentId) {
    console.warn("charge.refunded missing payment_intent", charge.id);
    return;
  }

  const carryRequest = await findCarryRequestByPaymentIntentId(
    supabaseAdmin,
    paymentIntentId,
  );
  if (!carryRequest) {
    console.info("charge.refunded ignored unknown payment intent", paymentIntentId);
    return;
  }

  const amountRefunded = Number(charge.amount_refunded ?? 0);
  if (amountRefunded <= 0) {
    console.info("charge.refunded with zero amount", {
      carryRequestId: carryRequest.id,
      chargeId: charge.id,
    });
    return;
  }

  const paymentAmount = Number(carryRequest.payment_amount ?? 0);
  const platformFee = Number(carryRequest.platform_fee_amount ?? 0);
  const refundStatus = classifyRefundStatus(
    amountRefunded,
    paymentAmount,
    platformFee,
  );
  const paymentStatus =
    refundStatus === "FULL" ? "REFUNDED_FULL" : "REFUNDED_PARTIAL";

  const latestRefund = latestRefundFromCharge(charge);
  const stripeRefundId =
    latestRefund?.id ?? carryRequest.stripe_refund_id ?? null;

  const alreadySynced =
    carryRequest.refund_status === refundStatus &&
    Number(carryRequest.refunded_amount ?? 0) === amountRefunded &&
    (carryRequest.payment_status === paymentStatus ||
      carryRequest.payment_status === "REFUNDED_FULL" ||
      carryRequest.payment_status === "REFUNDED_PARTIAL");

  if (!alreadySynced) {
    const { error: updateError } = await supabaseAdmin
      .from("carry_requests")
      .update({
        refund_status: refundStatus,
        refunded_amount: amountRefunded,
        stripe_refund_id: stripeRefundId,
        refunded_at: new Date().toISOString(),
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carryRequest.id);

    if (updateError) {
      console.error("charge.refunded update failed", updateError.message);
      throw updateError;
    }
  }

  // Notify parties only for refunds we have not already recorded (e.g. Dashboard).
  const isNewRefundRecord =
    !carryRequest.refund_status && !carryRequest.stripe_refund_id;

  if (isNewRefundRecord) {
    await insertPartyNotifications(supabaseAdmin, {
      senderUserId: carryRequest.sender_user_id,
      travelerUserId: carryRequest.traveler_user_id,
      type: "PAYMENT_REFUNDED",
      senderTitle: "Refund processed",
      senderBody:
        refundStatus === "FULL"
          ? "A full refund has been processed for this carry request."
          : "A partial refund has been processed for this carry request. The service fee may be non-refundable.",
      travelerTitle: "Payment refunded",
      travelerBody:
        "The sender payment for this carry request was refunded. Check the request for details.",
      carryRequestId: carryRequest.id,
    });

    const alert = await sendAdminPaymentAlertEmail(
      {
        subject: `Carry4Me refund synced (${refundStatus})`,
        headline:
          "A Stripe charge.refunded event updated a carry request that had no prior refund record (likely Dashboard or external refund).",
        rows: [
          { label: "Carry request", value: carryRequest.id },
          { label: "Payment intent", value: paymentIntentId },
          { label: "Charge", value: charge.id },
          { label: "Refund status", value: refundStatus },
          { label: "Amount refunded", value: String(amountRefunded) },
          { label: "Request status", value: carryRequest.status },
        ],
      },
      Deno.env.get("RESEND_API_KEY"),
    );

    console.info("charge.refunded admin alert", alert);
  }

  console.info("charge.refunded processed", {
    carryRequestId: carryRequest.id,
    paymentIntentId,
    amountRefunded,
    refundStatus,
    alreadySynced,
    isNewRefundRecord,
  });
}

async function handleDisputeCreated(
  supabaseAdmin: SupabaseAdmin,
  dispute: Stripe.Dispute,
) {
  const carryRequest = await resolveCarryRequestForDispute(supabaseAdmin, dispute);
  if (!carryRequest) {
    console.info("charge.dispute.created ignored — no matching carry request", {
      disputeId: dispute.id,
    });
    return;
  }

  const alreadyOpen =
    carryRequest.stripe_dispute_id === dispute.id &&
    Boolean(carryRequest.dispute_status);

  if (!alreadyOpen) {
    const { error: updateError } = await supabaseAdmin
      .from("carry_requests")
      .update({
        stripe_dispute_id: dispute.id,
        dispute_status: dispute.status,
        dispute_reason: dispute.reason ?? null,
        disputed_amount: dispute.amount ?? null,
        disputed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", carryRequest.id);

    if (updateError) {
      console.error("charge.dispute.created update failed", updateError.message);
      throw updateError;
    }

    await insertPartyNotifications(supabaseAdmin, {
      senderUserId: carryRequest.sender_user_id,
      travelerUserId: carryRequest.traveler_user_id,
      type: "PAYMENT_DISPUTED",
      senderTitle: "Payment dispute opened",
      senderBody:
        "Your bank or card issuer opened a dispute on this carry request payment. Carry4Me has been notified and will review it.",
      travelerTitle: "Payment dispute opened",
      travelerBody:
        "A payment dispute was opened on this carry request. Payouts may be delayed until it is resolved.",
      carryRequestId: carryRequest.id,
    });
  }

  const alert = await sendAdminPaymentAlertEmail(
    {
      subject: `Carry4Me dispute opened — ${dispute.status}`,
      headline:
        "A Stripe chargeback/dispute was created. Review evidence in the Stripe Dashboard and follow up with both parties.",
      rows: [
        { label: "Carry request", value: carryRequest.id },
        { label: "Dispute", value: dispute.id },
        { label: "Status", value: dispute.status },
        { label: "Reason", value: dispute.reason ?? "—" },
        { label: "Amount", value: String(dispute.amount ?? 0) },
        { label: "Currency", value: (dispute.currency ?? "—").toUpperCase() },
        { label: "Request status", value: carryRequest.status },
        {
          label: "Payment intent",
          value: paymentIntentIdFromStripeRef(dispute.payment_intent) ?? "—",
        },
      ],
    },
    Deno.env.get("RESEND_API_KEY"),
  );

  console.info("charge.dispute.created processed", {
    carryRequestId: carryRequest.id,
    disputeId: dispute.id,
    status: dispute.status,
    alreadyOpen,
    alert,
  });
}

async function handleDisputeClosed(
  supabaseAdmin: SupabaseAdmin,
  dispute: Stripe.Dispute,
) {
  const carryRequest = await resolveCarryRequestForDispute(supabaseAdmin, dispute);
  if (!carryRequest) {
    console.info("charge.dispute.closed ignored — no matching carry request", {
      disputeId: dispute.id,
    });
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from("carry_requests")
    .update({
      stripe_dispute_id: dispute.id,
      dispute_status: dispute.status,
      dispute_reason: dispute.reason ?? null,
      disputed_amount: dispute.amount ?? null,
      dispute_closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", carryRequest.id);

  if (updateError) {
    console.error("charge.dispute.closed update failed", updateError.message);
    throw updateError;
  }

  const outcomeLabel =
    dispute.status === "won"
      ? "won (funds kept / reinstated)"
      : dispute.status === "lost"
        ? "lost (funds returned to cardholder)"
        : dispute.status;

  await insertPartyNotifications(supabaseAdmin, {
    senderUserId: carryRequest.sender_user_id,
    travelerUserId: carryRequest.traveler_user_id,
    type: "PAYMENT_DISPUTE_CLOSED",
    senderTitle: "Payment dispute closed",
    senderBody: `The payment dispute on this carry request was closed: ${outcomeLabel}.`,
    travelerTitle: "Payment dispute closed",
    travelerBody: `The payment dispute on this carry request was closed: ${outcomeLabel}.`,
    carryRequestId: carryRequest.id,
  });

  const alert = await sendAdminPaymentAlertEmail(
    {
      subject: `Carry4Me dispute closed — ${dispute.status}`,
      headline: "A Stripe dispute was closed. Confirm payouts and request status are still correct.",
      rows: [
        { label: "Carry request", value: carryRequest.id },
        { label: "Dispute", value: dispute.id },
        { label: "Status", value: dispute.status },
        { label: "Reason", value: dispute.reason ?? "—" },
        { label: "Amount", value: String(dispute.amount ?? 0) },
        { label: "Request status", value: carryRequest.status },
      ],
    },
    Deno.env.get("RESEND_API_KEY"),
  );

  console.info("charge.dispute.closed processed", {
    carryRequestId: carryRequest.id,
    disputeId: dispute.id,
    status: dispute.status,
    alert,
  });
}

async function resolveCarryRequestForDispute(
  supabaseAdmin: SupabaseAdmin,
  dispute: Stripe.Dispute,
): Promise<CarryRequestPaymentRow | null> {
  const paymentIntentId = paymentIntentIdFromStripeRef(dispute.payment_intent);
  if (paymentIntentId) {
    const byPi = await findCarryRequestByPaymentIntentId(
      supabaseAdmin,
      paymentIntentId,
    );
    if (byPi) return byPi;
  }

  // Fallback: some dispute payloads omit payment_intent; resolve via charge → PI.
  const chargeId = paymentIntentIdFromStripeRef(dispute.charge);
  if (!chargeId) return null;

  try {
    const stripe = getStripe();
    const charge = await stripe.charges.retrieve(chargeId);
    const piFromCharge = paymentIntentIdFromStripeRef(charge.payment_intent);
    if (!piFromCharge) return null;
    return await findCarryRequestByPaymentIntentId(supabaseAdmin, piFromCharge);
  } catch (err) {
    console.error("resolveCarryRequestForDispute charge lookup failed", err);
    return null;
  }
}

function latestRefundFromCharge(charge: Stripe.Charge): Stripe.Refund | null {
  const list = charge.refunds?.data;
  if (!list || list.length === 0) return null;
  return list[0] ?? null;
}

async function insertPartyNotifications(
  supabaseAdmin: SupabaseAdmin,
  args: {
    senderUserId: string;
    travelerUserId: string;
    type: string;
    senderTitle: string;
    senderBody: string;
    travelerTitle: string;
    travelerBody: string;
    carryRequestId: string;
  },
) {
  const metadata = {
    carry_request_id: args.carryRequestId,
    source: "stripe_webhook",
  };

  const { error } = await supabaseAdmin.from("notifications").insert([
    {
      user_id: args.senderUserId,
      type: args.type,
      title: args.senderTitle,
      body: args.senderBody,
      link: "/requests",
      metadata,
    },
    {
      user_id: args.travelerUserId,
      type: args.type,
      title: args.travelerTitle,
      body: args.travelerBody,
      link: "/requests",
      metadata,
    },
  ]);

  if (error) {
    console.error("stripe-webhook notification insert failed", error.message);
    // Non-fatal: payment/dispute row updates are the source of truth.
  }
}

async function handleAccountUpdated(
  supabaseAdmin: SupabaseAdmin,
  account: Stripe.Account,
) {
  const userId = await findProfileIdByStripeAccountId(supabaseAdmin, account.id);
  if (!userId) {
    console.info("stripe-webhook account.updated ignored unknown account", account.id);
    return;
  }

  await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);

  const stripe = getStripe();
  await retryPendingTravelerTransfersForUser(stripe, supabaseAdmin, userId);

  console.info("stripe-webhook account.updated synced", {
    userId,
    accountId: account.id,
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
  });
}

async function handlePayoutPaid(
  supabaseAdmin: SupabaseAdmin,
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
