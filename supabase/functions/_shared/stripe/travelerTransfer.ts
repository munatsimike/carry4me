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

function travelerPayoutIdempotencyKey(carryRequestId: string): string {
  return `traveler-payout-${carryRequestId}`;
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

async function loadStoredStripeTransferId(
  supabaseAdmin: SupabaseClient,
  carryRequestId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("carry_requests")
    .select("stripe_transfer_id")
    .eq("id", carryRequestId)
    .maybeSingle();

  if (error) {
    console.error(
      "loadStoredStripeTransferId failed",
      carryRequestId,
      error.message,
    );
    return null;
  }

  const transferId = data?.stripe_transfer_id?.trim();
  return transferId || null;
}

/** Persist transfer id; returns the confirmed DB value, or null if not saved. */
async function persistStripeTransferId(
  supabaseAdmin: SupabaseClient,
  carryRequestId: string,
  transferId: string,
): Promise<string | null> {
  const { error: updateError } = await supabaseAdmin
    .from("carry_requests")
    .update({
      stripe_transfer_id: transferId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", carryRequestId)
    .is("stripe_transfer_id", null);

  if (updateError) {
    console.error(
      "persistStripeTransferId update failed",
      carryRequestId,
      transferId,
      updateError.message,
    );
  }

  const stored = await loadStoredStripeTransferId(supabaseAdmin, carryRequestId);
  return stored;
}

/** Retry traveler transfers after Connect is ready — only for OTP-verified requests. */
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
      "id, traveler_user_id, traveler_payout_amount, payment_currency, stripe_payment_intent_id, payment_status, delivery_otp_verified_at, status, stripe_transfer_id",
    )
    .eq("traveler_user_id", travelerUserId)
    .eq("payment_status", "SUCCEEDED")
    .not("stripe_payment_intent_id", "is", null)
    .not("delivery_otp_verified_at", "is", null)
    .is("stripe_transfer_id", null)
    .in("status", ["PENDING_PAYOUT", "PAID_OUT"]);

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

async function findExistingTravelerTransferId(
  stripe: Stripe,
  carryRequestId: string,
): Promise<string | null> {
  try {
    const listed = await stripe.transfers.list({ limit: 100 });
    const match = listed.data.find(
      (transfer) => transfer.metadata?.carry_request_id === carryRequestId,
    );
    return match?.id ?? null;
  } catch (err) {
    console.warn(
      "findExistingTravelerTransferId failed",
      carryRequestId,
      stripeErrorMessage(err),
    );
    return null;
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

  const existingTransferId = await loadStoredStripeTransferId(
    supabaseAdmin,
    input.carryRequestId,
  );
  if (existingTransferId) {
    return { ok: true, transferId: existingTransferId };
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

  let transferId: string | null = null;
  try {
    // Idempotency key ensures retries reuse the same Stripe Transfer (within 24h).
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
        idempotencyKey: travelerPayoutIdempotencyKey(input.carryRequestId),
      },
    );
    transferId = transfer.id;
  } catch (err) {
    console.error(
      "transferTravelerPayoutForPayment failed",
      input.carryRequestId,
      stripeErrorMessage(err),
    );

    // Older requests may already have been paid out under the previous timing;
    // recover the existing transfer instead of failing permanently.
    transferId = await findExistingTravelerTransferId(stripe, input.carryRequestId);
    if (!transferId) {
      return { ok: false, reason: "TRANSFER_FAILED" };
    }
  }

  const persistedId = await persistStripeTransferId(
    supabaseAdmin,
    input.carryRequestId,
    transferId,
  );

  if (!persistedId) {
    console.error(
      "transferTravelerPayoutForPayment persist failed after Stripe transfer",
      input.carryRequestId,
      transferId,
    );
    return { ok: false, reason: "TRANSFER_ID_PERSIST_FAILED" };
  }

  return { ok: true, transferId: persistedId };
}

/**
 * After delivery OTP is verified, move the traveler share from the platform
 * balance to their Connect account. Funds stay on the platform until this runs.
 */
export async function releaseTravelerPayoutAfterDeliveryVerification(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  carryRequestId: string,
): Promise<TransferResult> {
  const { data: carryRequest, error } = await supabaseAdmin
    .from("carry_requests")
    .select(
      "id, traveler_user_id, traveler_payout_amount, payment_currency, stripe_payment_intent_id, payment_status, delivery_otp_verified_at, status, stripe_transfer_id",
    )
    .eq("id", carryRequestId)
    .maybeSingle();

  if (error || !carryRequest) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const existingTransferId = carryRequest.stripe_transfer_id?.trim();
  if (existingTransferId) {
    return { ok: true, transferId: existingTransferId };
  }

  if (!carryRequest.delivery_otp_verified_at) {
    return { ok: false, reason: "OTP_NOT_VERIFIED" };
  }

  if (carryRequest.payment_status !== "SUCCEEDED") {
    return { ok: false, reason: "PAYMENT_NOT_CONFIRMED" };
  }

  if (!carryRequest.stripe_payment_intent_id) {
    return { ok: false, reason: "MISSING_PAYMENT_INTENT" };
  }

  if (
    carryRequest.status !== "PENDING_PAYOUT" &&
    carryRequest.status !== "PAID_OUT"
  ) {
    return { ok: false, reason: "INVALID_STATUS" };
  }

  try {
    const paymentIntent = await paymentIntentWithCharge(
      stripe,
      await stripe.paymentIntents.retrieve(carryRequest.stripe_payment_intent_id),
    );

    return await transferTravelerPayoutForPayment(stripe, supabaseAdmin, {
      carryRequestId: carryRequest.id,
      travelerUserId: carryRequest.traveler_user_id,
      paymentIntent,
      travelerPayoutAmount: Number(carryRequest.traveler_payout_amount ?? 0),
      paymentCurrency: carryRequest.payment_currency ?? paymentIntent.currency,
    });
  } catch (err) {
    console.error(
      "releaseTravelerPayoutAfterDeliveryVerification failed",
      carryRequestId,
      stripeErrorMessage(err),
    );
    return { ok: false, reason: "TRANSFER_FAILED" };
  }
}
