import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export function isMissingStripeAccountError(err: unknown): boolean {
  if (!(err instanceof Stripe.errors.StripeInvalidRequestError)) {
    return false;
  }

  const code = err.code?.toLowerCase() ?? "";
  const message = err.message?.toLowerCase() ?? "";

  return (
    code === "resource_missing" ||
    err.param === "account" ||
    message.includes("no such account") ||
    message.includes("does not exist")
  );
}

export function stripeErrorMessage(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) {
    return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Unknown Stripe error";
}
