/** Must match `v_checkout_grace_minutes` in expire_carry_request migration. */
export const PAYMENT_CHECKOUT_GRACE_MS = 30 * 60 * 1000;

type PaymentExpiryFields = {
  paymentExpiresAt: string | null;
  stripePaymentIntentId?: string | null;
  paymentStatus?: string | null;
};

export function isPastPaymentWindowWithCheckoutGrace(
  fields: PaymentExpiryFields,
  now = Date.now(),
): boolean {
  if (fields.paymentStatus === "SUCCEEDED") {
    return false;
  }

  if (!fields.paymentExpiresAt) {
    return false;
  }

  const expiresAt = new Date(fields.paymentExpiresAt).getTime();
  if (now <= expiresAt) {
    return false;
  }

  if (
    fields.stripePaymentIntentId &&
    now <= expiresAt + PAYMENT_CHECKOUT_GRACE_MS
  ) {
    return false;
  }

  return true;
}
