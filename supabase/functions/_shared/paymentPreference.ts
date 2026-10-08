export type PaymentPreference = "handover" | "delivery" | "flexible";

export function normalizePaymentPreference(
  value: string | null | undefined,
): PaymentPreference {
  if (value === "handover" || value === "delivery" || value === "flexible") {
    return value;
  }
  return "flexible";
}

export function paymentCodeGiveWhenCopy(
  value: string | null | undefined,
): string {
  const preference = normalizePaymentPreference(value);
  if (preference === "handover") {
    return "after parcel handover";
  }
  if (preference === "delivery") {
    return "after successful delivery";
  }
  return "after parcel handover or after successful delivery";
}

export function senderPaymentCodeHelperText(
  value: string | null | undefined,
): string {
  return `Check your email for the payment code. Give it to the traveler ${paymentCodeGiveWhenCopy(value)} to release payment.`;
}

export function senderPaymentCodeEmailBody(
  otp: string,
  value: string | null | undefined,
): string {
  return `Give this 6-digit code to the traveler ${paymentCodeGiveWhenCopy(value)} to release payment: ${otp}.`;
}
