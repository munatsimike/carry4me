import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";

export type VerifyDeliveryOtpResponse = {
  ok: boolean;
  reason?: string;
  message?: string;
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

export function deliveryOtpFailureMessage(result: VerifyDeliveryOtpResponse): string {
  if (result.message) return result.message;
  if (result.reason === "OTP_ATTEMPTS_EXCEEDED") {
    return "Too many failed attempts. Ask the sender for a new code.";
  }
  if (result.reason === "TRAVELER_PAYOUT_NOT_READY") {
    return "Complete Stripe payout setup before releasing payment.";
  }
  if (
    result.reason === "TRANSFER_FAILED" ||
    result.reason === "MISSING_CHARGE" ||
    result.reason === "TRANSFER_ID_PERSIST_FAILED"
  ) {
    return "Could not release payment to your payout account. Try again in a moment.";
  }
  if (result.reason === "TRANSFER_NOT_CONFIRMED") {
    return "Traveler payout has not been confirmed yet. Verify the delivery code again.";
  }
  return "Could not verify the delivery code.";
}
