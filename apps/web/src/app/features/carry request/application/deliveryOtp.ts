import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";

export type VerifyDeliveryOtpResponse = {
  ok: boolean;
  reason?: string;
  message?: string;
  stripe_error?: string | null;
  attempts_remaining?: number;
};

export async function verifyDeliveryOtp(
  carryRequestId: string,
  otp: string,
): Promise<VerifyDeliveryOtpResponse> {
  return invokeStripeFunction<VerifyDeliveryOtpResponse>("verify-delivery-otp", {
    carry_request_id: carryRequestId,
    otp,
  });
}

export async function resendDeliveryOtp(
  carryRequestId: string,
): Promise<{ ok: boolean; message?: string; dev_otp?: string }> {
  return invokeStripeFunction("generate-delivery-otp", {
    carry_request_id: carryRequestId,
  });
}

const FRIENDLY_BY_REASON: Record<string, string> = {
  OTP_INVALID: "Incorrect code. Please try again.",
  OTP_ATTEMPTS_EXCEEDED:
    "Too many failed attempts. Ask the sender for a new code.",
  OTP_NOT_GENERATED:
    "No delivery code is active yet. Wait for delivery confirmation.",
  INVALID_STATUS: "This request is not ready for payout release.",
  FORBIDDEN: "Only the traveler can verify the delivery code.",
  NOT_FOUND: "Carry request not found.",
  OTP_NOT_VERIFIED: "Verify the delivery code before releasing payment.",
  PAYMENT_NOT_CONFIRMED: "Sender payment is not confirmed yet.",
  TRAVELER_PAYOUT_NOT_READY:
    "Complete Stripe payout setup before releasing payment.",
  TRANSFER_FAILED:
    "Could not release payment to your payout account. If the problem persists, contact Carry4Me.",
  TRANSFER_ID_PERSIST_FAILED:
    "Payment is still being confirmed. Try again in a moment.",
  TRANSFER_NOT_CONFIRMED:
    "Payment is still being confirmed. Verify the delivery code again.",
  MISSING_CHARGE: "Payment is still processing. Try again in a moment.",
  MISSING_PAYMENT_INTENT: "No payment was found for this request.",
  INVALID_PAYOUT_AMOUNT: "Payout amount looks wrong. Contact support.",
};

function looksLikeTechnicalErrorDetail(text: string): boolean {
  const value = text.toLowerCase();
  return (
    value.includes("stripe:") ||
    value.includes("reason:") ||
    value.includes("transfer_failed") ||
    value.includes("source_transaction") ||
    value.includes("balance transaction") ||
    value.includes("idempotency") ||
    /\b[A-Z][A-Z0-9_]{5,}\b/.test(text)
  );
}

/** User-facing copy only — never expose Stripe/reason codes. */
export function deliveryOtpFailureMessage(result: VerifyDeliveryOtpResponse): string {
  if (result.reason && FRIENDLY_BY_REASON[result.reason]) {
    return FRIENDLY_BY_REASON[result.reason];
  }

  const message = result.message?.trim();
  if (message && !looksLikeTechnicalErrorDetail(message)) {
    return message;
  }

  return "Could not verify the delivery code. Try again in a moment.";
}
