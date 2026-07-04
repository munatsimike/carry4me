import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { resolveTravelerConnectAccountForPayment } from "./connectAccount.ts";
import { stripeErrorMessage } from "./errors.ts";

type TransferResult =
  | { ok: true; transferId: string }
  | { ok: false; reason: string };

function chargeIdFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): string | null {
  const latestCharge = paymentIntent.latest_charge;
  if (typeof latestCharge === "string") {
    return latestCharge;
  }
  return latestCharge?.id ?? null;
}

/** Returns the traveler's Connect account id when they can receive platform transfers. */
export async function resolveTravelerPayoutDestinationAccount(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  travelerUserId: string,
): Promise<string | null> {
  return resolveTravelerConnectAccountForPayment(
    stripe,
    supabaseAdmin,
    travelerUserId,
  );
}

async function paymentIntentWithCharge(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent,
): Promise<Stripe.PaymentIntent> {
  if (chargeIdFromPaymentIntent(paymentIntent)) {
    return paymentIntent;
  }

  return stripe.paymentIntents.retrieve(paymentIntent.id, {
    expand: ["latest_charge"],
  });
}

/** Retry traveler transfers after Connect onboarding completes or profile syncs. */
export async function retryPendingTravelerTransfersForUser(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  travelerUserId: string,
): Promise<void> {
  const destinationReady = await resolveTravelerPayoutDestinationAccount(
    stripe,
    supabaseAdmin,
    travelerUserId,
  );
  if (!destinationReady) {
    return;
  }

  const { data: carryRequests, error } = await supabaseAdmin
    .from("carry_requests")
    .select(
      "id, traveler_user_id, traveler_payout_amount, payment_currency, stripe_payment_intent_id, payment_status",
    )
    .eq("traveler_user_id", travelerUserId)
    .eq("payment_status", "SUCCEEDED")
    .not("stripe_payment_intent_id", "is", null);

  if (error) {
    console.warn(
      "retryPendingTravelerTransfersForUser load failed",
      travelerUserId,
      error.message,
    );
    return;
  }

  for (const carryRequest of carryRequests ?? []) {
    if (!carryRequest.stripe_payment_intent_id) continue;

    try {
      const paymentIntent = await paymentIntentWithCharge(
        stripe,
        await stripe.paymentIntents.retrieve(carryRequest.stripe_payment_intent_id),
      );

      const result = await transferTravelerPayoutForPayment(
        stripe,
        supabaseAdmin,
        {
          carryRequestId: carryRequest.id,
          travelerUserId: carryRequest.traveler_user_id,
          paymentIntent,
          travelerPayoutAmount: Number(carryRequest.traveler_payout_amount ?? 0),
          paymentCurrency: carryRequest.payment_currency ?? paymentIntent.currency,
        },
      );

      if (result.ok) {
        console.info("retryPendingTravelerTransfersForUser sent transfer", {
          carryRequestId: carryRequest.id,
          transferId: result.transferId,
        });
      }
    } catch (err) {
      console.warn(
        "retryPendingTravelerTransfersForUser skipped request",
        carryRequest.id,
        stripeErrorMessage(err),
      );
    }
  }
}

export async function transferTravelerPayoutForPayment(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  input: {
    carryRequestId: string;
    travelerUserId: string;
    paymentIntent: Stripe.PaymentIntent;
    travelerPayoutAmount: number;
    paymentCurrency: string;
  },
): Promise<TransferResult> {
  if (input.travelerPayoutAmount <= 0) {
    return { ok: false, reason: "INVALID_PAYOUT_AMOUNT" };
  }

  const destinationAccountId = await resolveTravelerPayoutDestinationAccount(
    stripe,
    supabaseAdmin,
    input.travelerUserId,
  );

  if (!destinationAccountId) {
    return { ok: false, reason: "TRAVELER_PAYOUT_NOT_READY" };
  }

  const sourceTransaction = chargeIdFromPaymentIntent(
    await paymentIntentWithCharge(stripe, input.paymentIntent),
  );
  if (!sourceTransaction) {
    return { ok: false, reason: "MISSING_CHARGE" };
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: input.travelerPayoutAmount,
        currency: input.paymentCurrency,
        destination: destinationAccountId,
        source_transaction: sourceTransaction,
        metadata: {
          carry_request_id: input.carryRequestId,
          payment_intent_id: input.paymentIntent.id,
          traveler_user_id: input.travelerUserId,
        },
      },
      {
        idempotencyKey: `traveler-payout-${input.carryRequestId}`,
      },
    );

    return { ok: true, transferId: transfer.id };
  } catch (err) {
    console.error(
      "transferTravelerPayoutForPayment failed",
      input.carryRequestId,
      stripeErrorMessage(err),
    );
    return { ok: false, reason: "TRANSFER_FAILED" };
  }
}
