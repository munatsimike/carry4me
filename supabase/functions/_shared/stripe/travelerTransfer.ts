import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { resolveTravelerConnectAccountForPayment } from "./connectAccount.ts";
import { stripeErrorMessage } from "./errors.ts";

type TransferResult =
  | { ok: true; transferId: string }
  | { ok: false; reason: string; message?: string };

function chargeIdFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): string | null {
  const latestCharge = paymentIntent.latest_charge;
  if (typeof latestCharge === "string") {
    return latestCharge;
  }
  return latestCharge?.id ?? null;
}

function travelerPayoutIdempotencyKey(
  carryRequestId: string,
  currency: string,
): string {
  // Include currency so a corrected currency retry is not blocked by Stripe
  // replaying an earlier failed attempt under the same key.
  return `traveler-payout-v3-${carryRequestId}-${normalizeCurrency(currency)}`;
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toLowerCase();
}

type SourceChargeTransferBasis = {
  chargeId: string;
  /** Currency of the funds available to transfer (balance transaction). */
  currency: string;
  /** Traveler payout amount in balance-transaction minor units. */
  amount: number;
};

/**
 * Stripe requires transfer.currency to match the charge's balance_transaction
 * currency — which can differ from PaymentIntent.currency after FX settlement.
 */
async function resolveSourceChargeTransferBasis(
  stripe: Stripe,
  chargeId: string,
  travelerPayoutAmount: number,
  fallbackCurrency: string,
): Promise<SourceChargeTransferBasis> {
  const charge = await stripe.charges.retrieve(chargeId, {
    expand: ["balance_transaction"],
  });

  const balanceTx = charge.balance_transaction;
  const balanceCurrency =
    typeof balanceTx === "object" && balanceTx && "currency" in balanceTx
      ? normalizeCurrency(String(balanceTx.currency))
      : normalizeCurrency(charge.currency || fallbackCurrency || "usd");

  const chargeCurrency = normalizeCurrency(charge.currency || fallbackCurrency || "usd");
  const balanceAmount =
    typeof balanceTx === "object" && balanceTx && typeof balanceTx.amount === "number"
      ? balanceTx.amount
      : null;

  let amount = Math.round(travelerPayoutAmount);
  if (
    balanceAmount != null &&
    charge.amount > 0 &&
    balanceCurrency !== chargeCurrency
  ) {
    // Scale traveler share from presentment currency into settlement currency.
    amount = Math.max(
      1,
      Math.floor((travelerPayoutAmount * balanceAmount) / charge.amount),
    );
  }

  return {
    chargeId: charge.id,
    currency: balanceCurrency,
    amount,
  };
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
      } else {
        console.warn("retryPendingTravelerTransfersForUser transfer failed", {
          carryRequestId: carryRequest.id,
          reason: result.reason,
          message: result.message,
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
  sourceChargeId?: string | null,
): Promise<string | null> {
  try {
    let startingAfter: string | undefined;

    for (let page = 0; page < 10; page++) {
      const listed = await stripe.transfers.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      const match = listed.data.find((transfer) => {
        if (transfer.metadata?.carry_request_id === carryRequestId) {
          return true;
        }
        if (
          sourceChargeId &&
          typeof transfer.source_transaction === "string" &&
          transfer.source_transaction === sourceChargeId
        ) {
          return true;
        }
        if (
          sourceChargeId &&
          transfer.source_transaction &&
          typeof transfer.source_transaction === "object" &&
          "id" in transfer.source_transaction &&
          transfer.source_transaction.id === sourceChargeId
        ) {
          return true;
        }
        return false;
      });

      if (match) {
        return match.id;
      }

      if (!listed.has_more || listed.data.length === 0) {
        break;
      }

      startingAfter = listed.data[listed.data.length - 1]?.id;
      if (!startingAfter) break;
    }

    return null;
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
    return {
      ok: false,
      reason: "INVALID_PAYOUT_AMOUNT",
      message: `Invalid traveler payout amount: ${input.travelerPayoutAmount}`,
    };
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
    return {
      ok: false,
      reason: "TRAVELER_PAYOUT_NOT_READY",
      message:
        "Traveler Stripe Connect account is not ready to receive transfers.",
    };
  }

  const chargedIntent = await paymentIntentWithCharge(stripe, input.paymentIntent);
  const sourceTransaction = chargeIdFromPaymentIntent(chargedIntent);
  if (!sourceTransaction) {
    return {
      ok: false,
      reason: "MISSING_CHARGE",
      message: "PaymentIntent has no charge to transfer from yet.",
    };
  }

  let transferBasis: SourceChargeTransferBasis;
  try {
    transferBasis = await resolveSourceChargeTransferBasis(
      stripe,
      sourceTransaction,
      input.travelerPayoutAmount,
      chargedIntent.currency || input.paymentCurrency || "usd",
    );
  } catch (err) {
    return {
      ok: false,
      reason: "TRANSFER_FAILED",
      message: stripeErrorMessage(err),
    };
  }

  const currency = transferBasis.currency;
  const transferAmount = transferBasis.amount;

  // Prefer recovering an existing transfer before creating a new one
  // (covers older requests that were paid out at payment time).
  const preexisting = await findExistingTravelerTransferId(
    stripe,
    input.carryRequestId,
    sourceTransaction,
  );
  if (preexisting) {
    const persistedExisting = await persistStripeTransferId(
      supabaseAdmin,
      input.carryRequestId,
      preexisting,
    );
    if (persistedExisting) {
      return { ok: true, transferId: persistedExisting };
    }
    return {
      ok: false,
      reason: "TRANSFER_ID_PERSIST_FAILED",
      message: `Found existing Stripe transfer ${preexisting} but could not save it on the request.`,
    };
  }

  let transferId: string | null = null;
  let stripeFailureMessage: string | null = null;
  try {
    const transfer = await stripe.transfers.create(
      {
        amount: transferAmount,
        currency,
        destination: destinationAccountId,
        source_transaction: sourceTransaction,
        metadata: {
          carry_request_id: input.carryRequestId,
          payment_intent_id: input.paymentIntent.id,
          traveler_user_id: input.travelerUserId,
          presentment_currency: normalizeCurrency(
            chargedIntent.currency || input.paymentCurrency || currency,
          ),
          presentment_amount: String(input.travelerPayoutAmount),
        },
      },
      {
        idempotencyKey: travelerPayoutIdempotencyKey(
          input.carryRequestId,
          currency,
        ),
      },
    );
    transferId = transfer.id;
  } catch (err) {
    stripeFailureMessage = stripeErrorMessage(err);
    console.error(
      "transferTravelerPayoutForPayment failed",
      {
        carryRequestId: input.carryRequestId,
        amount: transferAmount,
        presentmentAmount: input.travelerPayoutAmount,
        currency,
        destinationAccountId,
        sourceTransaction,
        stripeError: stripeFailureMessage,
      },
    );

    transferId = await findExistingTravelerTransferId(
      stripe,
      input.carryRequestId,
      sourceTransaction,
    );
    if (!transferId) {
      return {
        ok: false,
        reason: "TRANSFER_FAILED",
        message: stripeFailureMessage,
      };
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
    return {
      ok: false,
      reason: "TRANSFER_ID_PERSIST_FAILED",
      message: `Stripe transfer ${transferId} was created but could not be saved. Try again.`,
    };
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
    return {
      ok: false,
      reason: "NOT_FOUND",
      message: error?.message ?? "Carry request not found.",
    };
  }

  const existingTransferId = carryRequest.stripe_transfer_id?.trim();
  if (existingTransferId) {
    return { ok: true, transferId: existingTransferId };
  }

  if (!carryRequest.delivery_otp_verified_at) {
    return { ok: false, reason: "OTP_NOT_VERIFIED" };
  }

  if (carryRequest.payment_status !== "SUCCEEDED") {
    return {
      ok: false,
      reason: "PAYMENT_NOT_CONFIRMED",
      message: `Payment status is ${carryRequest.payment_status ?? "null"}, expected SUCCEEDED.`,
    };
  }

  if (!carryRequest.stripe_payment_intent_id) {
    return { ok: false, reason: "MISSING_PAYMENT_INTENT" };
  }

  if (
    carryRequest.status !== "PENDING_PAYOUT" &&
    carryRequest.status !== "PAID_OUT"
  ) {
    return {
      ok: false,
      reason: "INVALID_STATUS",
      message: `Request status is ${carryRequest.status}, expected PENDING_PAYOUT.`,
    };
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
    const message = stripeErrorMessage(err);
    console.error(
      "releaseTravelerPayoutAfterDeliveryVerification failed",
      carryRequestId,
      message,
    );
    return { ok: false, reason: "TRANSFER_FAILED", message };
  }
}
