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

export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(getStripePublishableKey());
  }
  return stripePromise;
}
