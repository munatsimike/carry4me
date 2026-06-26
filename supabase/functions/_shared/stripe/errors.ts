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

/** Test Connect account id stored while using live keys (or the reverse). */
export function isStripeLiveModeMismatchError(err: unknown): boolean {
  if (!(err instanceof Stripe.errors.StripeInvalidRequestError)) {
    return false;
  }

  const message = err.message?.toLowerCase() ?? "";
  return (
    message.includes("test mode") ||
    message.includes("live mode") ||
    message.includes("mismatched api key")
  );
}

export function isStaleStripeConnectAccountError(err: unknown): boolean {
  return isMissingStripeAccountError(err) || isStripeLiveModeMismatchError(err);
}

export function isStripeIdempotencyError(err: unknown): boolean {
  if (!(err instanceof Stripe.errors.StripeIdempotencyError)) {
    return false;
  }

  return true;
}

export function isStripeAccountCreateConflict(err: unknown): boolean {
  if (!(err instanceof Stripe.errors.StripeInvalidRequestError)) {
    return false;
  }

  const message = err.message?.toLowerCase() ?? "";
  return (
    message.includes("idempotency") ||
    message.includes("keys for idempotent requests") ||
    message.includes("already uses")
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
