export type PaymentPreference = "handover" | "delivery" | "flexible";

export function normalizePaymentPreference(
  value: string | null | undefined,
): PaymentPreference {
  if (value === "handover" || value === "delivery" || value === "flexible") {
    return value;
  }
  return "flexible";
}

export function agreedPaymentPreference(
  a: string | null | undefined,
  b: string | null | undefined,
): PaymentPreference {
  const left = normalizePaymentPreference(a);
  const right = normalizePaymentPreference(b);
  if (left === "flexible") return right;
  if (right === "flexible") return left;
  if (left === right) return left;
  return "flexible";
}

export function canReleasePayoutAtHandover(
  value: string | null | undefined,
): boolean {
  return normalizePaymentPreference(value) !== "delivery";
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
