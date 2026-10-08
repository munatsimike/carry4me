export const PAYMENT_PREFERENCES = {
  HANDOVER: "handover",
  DELIVERY: "delivery",
  FLEXIBLE: "flexible",
} as const;

export type PaymentPreference =
  (typeof PAYMENT_PREFERENCES)[keyof typeof PAYMENT_PREFERENCES];

export const PAYMENT_PREFERENCE_HEADING = "Payment terms";
export const PAYMENT_TERMS_CARD_LABEL = "Payment terms";

export const SENDER_PAYMENT_PREFERENCE_DESCRIPTION =
  "Your payment will be held securely. Choose when you'd like the payment to be released";

export const TRAVELER_PAYMENT_PREFERENCE_DESCRIPTION =
  "Choose when you'd like to be paid";

export const SENDER_PAYMENT_PREFERENCE_OPTIONS = [
  {
    id: PAYMENT_PREFERENCES.HANDOVER,
    label: "I want to pay after parcel handover",
  },
  {
    id: PAYMENT_PREFERENCES.DELIVERY,
    label: "I want to pay after successful delivery",
  },
  {
    id: PAYMENT_PREFERENCES.FLEXIBLE,
    label: "I'm flexible with both options",
  },
] as const;

export const TRAVELER_PAYMENT_PREFERENCE_OPTIONS = [
  {
    id: PAYMENT_PREFERENCES.HANDOVER,
    label: "I want to be paid after parcel handover",
  },
  {
    id: PAYMENT_PREFERENCES.DELIVERY,
    label: "I want to be paid after successful delivery",
  },
  {
    id: PAYMENT_PREFERENCES.FLEXIBLE,
    label: "I'm flexible with both options",
  },
] as const;

export function normalizePaymentPreference(
  value: string | null | undefined,
): PaymentPreference {
  if (
    value === PAYMENT_PREFERENCES.HANDOVER ||
    value === PAYMENT_PREFERENCES.DELIVERY ||
    value === PAYMENT_PREFERENCES.FLEXIBLE
  ) {
    return value;
  }
  return PAYMENT_PREFERENCES.FLEXIBLE;
}

/** Flexible matches either timing; handover and delivery only match themselves. */
export function paymentPreferencesCompatible(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizePaymentPreference(a);
  const right = normalizePaymentPreference(b);
  return (
    left === PAYMENT_PREFERENCES.FLEXIBLE ||
    right === PAYMENT_PREFERENCES.FLEXIBLE ||
    left === right
  );
}

export function paymentCodeGiveWhenCopy(
  value: string | null | undefined,
): string {
  const preference = normalizePaymentPreference(value);
  if (preference === PAYMENT_PREFERENCES.HANDOVER) {
    return "after parcel handover";
  }
  if (preference === PAYMENT_PREFERENCES.DELIVERY) {
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

export function paymentReleaseCardLabel(
  value: string | null | undefined,
): string {
  const preference = normalizePaymentPreference(value);
  if (preference === PAYMENT_PREFERENCES.HANDOVER) {
    return "After handover";
  }
  if (preference === PAYMENT_PREFERENCES.DELIVERY) {
    return "After delivery";
  }
  return "Flexible";
}

export const PAYMENT_RELEASE_FILTER_OPTIONS = [
  {
    id: PAYMENT_PREFERENCES.HANDOVER,
    label: "After handover",
  },
  {
    id: PAYMENT_PREFERENCES.DELIVERY,
    label: "After delivery",
  },
  {
    id: PAYMENT_PREFERENCES.FLEXIBLE,
    label: "Flexible",
  },
] as const;

export function paymentPreferenceLabel(
  value: string | null | undefined,
  role: "sender" | "traveler",
): string {
  const options =
    role === "sender"
      ? SENDER_PAYMENT_PREFERENCE_OPTIONS
      : TRAVELER_PAYMENT_PREFERENCE_OPTIONS;
  return options.find((option) => option.id === value)?.label ?? "—";
}
