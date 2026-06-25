import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isStripeLiveMode } from "./client.ts";
import {
  isStaleStripeConnectAccountError,
  stripeErrorMessage,
} from "./errors.ts";
import {
  isTravelerStripeVerified,
  loadTravelerProfile,
  mapStripeVerificationStatus,
  resetStripeConnectProfile,
} from "./profiles.ts";

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

async function resolveTravelerDestinationAccount(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  travelerUserId: string,
): Promise<string | null> {
  const profile = await loadTravelerProfile(supabaseAdmin, travelerUserId);
  if (!profile?.stripe_account_id || !isTravelerStripeVerified(profile)) {
    return null;
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    if (account.livemode !== isStripeLiveMode()) {
      await resetStripeConnectProfile(supabaseAdmin, travelerUserId);
      return null;
    }

    if (!account.charges_enabled || !account.payouts_enabled) {
      return null;
    }

    const verificationStatus = mapStripeVerificationStatus(account);
    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled === true,
        stripe_payouts_enabled: account.payouts_enabled === true,
        stripe_details_submitted: account.details_submitted === true,
        stripe_verification_status: verificationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", travelerUserId);

    return account.id;
  } catch (err) {
    if (isStaleStripeConnectAccountError(err)) {
      await resetStripeConnectProfile(supabaseAdmin, travelerUserId);
      return null;
    }

    console.warn(
      "resolveTravelerDestinationAccount lookup failed",
      travelerUserId,
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

  const destinationAccountId = await resolveTravelerDestinationAccount(
    stripe,
    supabaseAdmin,
    input.travelerUserId,
  );

  if (!destinationAccountId) {
    return { ok: false, reason: "TRAVELER_PAYOUT_NOT_READY" };
  }

  const sourceTransaction = chargeIdFromPaymentIntent(input.paymentIntent);
  if (!sourceTransaction) {
    return { ok: false, reason: "MISSING_CHARGE" };
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: input.travelerPayoutAmount,
      currency: input.paymentCurrency,
      destination: destinationAccountId,
      source_transaction: sourceTransaction,
      metadata: {
        carry_request_id: input.carryRequestId,
        payment_intent_id: input.paymentIntent.id,
      },
    });

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
