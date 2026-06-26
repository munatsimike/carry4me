import { loadStripe, type Stripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePublishableKey(): string {
  const key = publishableKey?.trim();
  if (!key) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not configured.");
  }
  return key;
}

export function isStripeLiveMode(): boolean {
  return getStripePublishableKey().startsWith("pk_live_");
}

export function getMaskedStripePublishableKey(): string {
  const key = getStripePublishableKey();
  if (key.length <= 16) return key;
  return `${key.slice(0, 12)}…${key.slice(-4)}`;
}

export const STRIPE_CLIENT_PACKAGE_VERSIONS = {
  stripeJs: "9.8.0",
  reactStripeJs: "6.6.0",
} as const;

export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(getStripePublishableKey());
  }
  return stripePromise;
}
