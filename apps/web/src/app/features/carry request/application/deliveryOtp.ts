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
  if (result.reason === "OTP_EXPIRED") {
    return "This code has expired. Ask the sender for a new code.";
  }
  return "Could not verify the delivery code.";
}
