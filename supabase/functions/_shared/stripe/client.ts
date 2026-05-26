import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { requireEnv } from "./auth.ts";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = requireEnv("STRIPE_SECRET_KEY");
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripeClient;
}
