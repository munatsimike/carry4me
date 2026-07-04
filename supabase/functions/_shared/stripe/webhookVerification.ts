import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export function getStripeWebhookSecrets(): string[] {
  return [
    Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim(),
    Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET")?.trim(),
  ].filter((secret): secret is string => Boolean(secret));
}

export async function constructVerifiedStripeEvent(
  stripe: Stripe,
  body: string,
  signature: string,
): Promise<Stripe.Event | null> {
  const secrets = getStripeWebhookSecrets();

  for (const secret of secrets) {
    try {
      return await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch {
      // Try the next configured endpoint secret.
    }
  }

  return null;
}
