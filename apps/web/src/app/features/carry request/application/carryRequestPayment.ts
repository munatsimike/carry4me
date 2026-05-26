import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import { getStripePromise } from "@/app/shared/stripe/stripeClient";

type CreatePaymentIntentResponse = {
  client_secret: string;
  payment_intent_id: string;
};

type SyncPaymentResponse = {
  ok: boolean;
  payment_status?: string;
  stripe_status?: string;
  error?: string;
};

export async function createCarryRequestPaymentIntent(
  carryRequestId: string,
): Promise<CreatePaymentIntentResponse> {
  return invokeStripeFunction<CreatePaymentIntentResponse>(
    "create-payment-intent",
    { carry_request_id: carryRequestId },
  );
}

export async function syncCarryRequestPayment(
  carryRequestId: string,
): Promise<SyncPaymentResponse> {
  return invokeStripeFunction<SyncPaymentResponse>("sync-carry-request-payment", {
    carry_request_id: carryRequestId,
  });
}

/** Confirm PaymentIntent in Stripe.js, sync DB, ready for perform_carry_request_action PAY. */
export async function confirmCarryRequestStripePayment(
  carryRequestId: string,
  clientSecret: string,
): Promise<void> {
  const stripe = await getStripePromise();
  if (!stripe) {
    throw new Error("Stripe failed to load.");
  }

  const returnUrl = `${window.location.origin}/requests`;

  const result = await stripe.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: returnUrl,
    },
    redirect: "if_required",
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Payment could not be completed.");
  }

  if (result.paymentIntent?.status !== "succeeded") {
    throw new Error("Payment was not completed. Please try again.");
  }

  const sync = await syncCarryRequestPayment(carryRequestId);
  if (!sync.ok && sync.payment_status !== "SUCCEEDED") {
    throw new Error("Payment succeeded but could not be verified. Please refresh.");
  }
}
