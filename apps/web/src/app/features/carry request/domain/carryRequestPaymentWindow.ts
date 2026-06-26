import { PAYMENT_CHECKOUT_GRACE_MS } from "./carryRequestPaymentGrace";

/** Keep in sync with platform_settings.payment_window_minutes (240 = 4 hours). */
export const PAYMENT_WINDOW_MINUTES = 240;

export function formatPaymentWindowLabel(): string {
  if (PAYMENT_WINDOW_MINUTES % 60 === 0) {
    const hours = PAYMENT_WINDOW_MINUTES / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${PAYMENT_WINDOW_MINUTES} minutes`;
}

type PaymentTimeRemainingFields = {
  paymentExpiresAt: string | null;
  stripePaymentIntentId?: string | null;
  paymentStatus?: string | null;
};

function formatDurationRemaining(remainingMs: number): string {
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  if (hours > 0) {
    return `${hours}h remaining`;
  }
  if (minutes > 1) {
    return `${minutes}m remaining`;
  }

  return "Less than 1m remaining";
}

function formatCheckoutGraceRemaining(remainingMs: number): string {
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m to complete checkout`;
  }
  if (hours > 0) {
    return `${hours}h to complete checkout`;
  }
  if (minutes > 1) {
    return `${minutes}m to complete checkout`;
  }

  return "Less than 1m to complete checkout";
}

export type PaymentTimeRemainingViewer = "sender" | "traveler";

function formatPaymentTimeRemainingForViewer(
  label: string,
  viewer: PaymentTimeRemainingViewer,
): string {
  if (viewer === "sender") {
    return label;
  }

  if (label === "Expired") {
    return "Payment window expired";
  }

  if (label.includes("complete checkout")) {
    return `Sender is completing payment — ${label}`;
  }

  return `Sender has ${label.replace(" remaining", " to pay")}`;
}

export function formatPaymentTimeRemaining(
  fields: PaymentTimeRemainingFields,
  now = Date.now(),
  viewer: PaymentTimeRemainingViewer = "sender",
): string | null {
  if (!fields.paymentExpiresAt) {
    return null;
  }

  const expiresAt = new Date(fields.paymentExpiresAt).getTime();
  const remainingMs = expiresAt - now;

  if (remainingMs > 0) {
    return formatPaymentTimeRemainingForViewer(
      formatDurationRemaining(remainingMs),
      viewer,
    );
  }

  if (
    fields.stripePaymentIntentId &&
    fields.paymentStatus !== "SUCCEEDED"
  ) {
    const graceRemainingMs = expiresAt + PAYMENT_CHECKOUT_GRACE_MS - now;
    if (graceRemainingMs > 0) {
      return formatPaymentTimeRemainingForViewer(
        formatCheckoutGraceRemaining(graceRemainingMs),
        viewer,
      );
    }
  }

  return formatPaymentTimeRemainingForViewer("Expired", viewer);
}
