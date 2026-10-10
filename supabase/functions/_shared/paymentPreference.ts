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
  if (left === "handover" && right === "handover") return "handover";
  if (left === "delivery" || right === "delivery") return "delivery";
  return "flexible";
}

export function canReleasePayoutAtHandover(
  value: string | null | undefined,
): boolean {
  return normalizePaymentPreference(value) === "handover";
}

function nestedPaymentPreference(
  value:
    | { payment_preference?: string | null }
    | { payment_preference?: string | null }[]
    | null
    | undefined,
): string | null {
  if (Array.isArray(value)) {
    return value[0]?.payment_preference ?? null;
  }
  return value?.payment_preference ?? null;
}

export function canReleasePayoutAtHandoverFromListings(
  parcel:
    | { payment_preference?: string | null }
    | { payment_preference?: string | null }[]
    | null
    | undefined,
  trip:
    | { payment_preference?: string | null }
    | { payment_preference?: string | null }[]
    | null
    | undefined,
): boolean {
  return canReleasePayoutAtHandover(
    agreedPaymentPreference(
      nestedPaymentPreference(parcel),
      nestedPaymentPreference(trip),
    ),
  );
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
