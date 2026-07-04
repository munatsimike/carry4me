import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import { AppError } from "@/app/shared/domain/AppError";
import { getStripePromise } from "@/app/shared/stripe/stripeClient";

export const PAYMENT_SETUP_BLOCKED_CODES = new Set([
  "TRAVELER_STRIPE_LOOKUP_FAILED",
  "TRAVELER_STRIPE_OUTDATED",
]);

export function isPaymentSetupBlocked(error: unknown): boolean {
  const code = AppError.fromUnknown(error).code;
  return code != null && PAYMENT_SETUP_BLOCKED_CODES.has(code);
}

export function paymentSetupErrorMessage(error: unknown): string {
  const appError = AppError.fromUnknown(error);

  if (
    appError.status === 401 ||
    appError.code === "NOT_AUTHENTICATED" ||
    appError.code === "SESSION_EXPIRED"
  ) {
    return "Your sign-in session expired. Sign in again, then retry payment.";
  }

  if (appError.code === "TRAVELER_STRIPE_LOOKUP_FAILED") {
    return (
      appError.message ||
      "Could not verify the traveler's payout account. Ask them to complete Stripe verification, then try again."
    );
  }

  if (appError.code === "TRAVELER_STRIPE_OUTDATED") {
    return (
      appError.message ||
      "The traveler's payout account is not ready yet. Ask them to open Profile and refresh payout status, then try again."
    );
  }

  return appError.message;
}

type CreatePaymentIntentResponse = {
  client_secret: string;
  payment_intent_id: string;
  payment_amount: number;
  payment_currency: string;
  traveler_payout_amount: number;
  platform_fee_amount: number;
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

  const returnUrl =
    `${window.location.origin}/requests/pay/${encodeURIComponent(carryRequestId)}`;

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
