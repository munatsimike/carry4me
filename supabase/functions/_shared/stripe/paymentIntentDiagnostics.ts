import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export type PaymentIntentDebugSummary = {
  id: string;
  amount: number;
  amount_is_integer: boolean;
  currency: string;
  currency_is_lowercase: boolean;
  payment_method_types: string[];
  automatic_payment_methods: Stripe.PaymentIntent.AutomaticPaymentMethods | null;
  application_fee_amount: number | null;
  transfer_data: Stripe.PaymentIntent.TransferData | null;
  on_behalf_of: string | null;
  livemode: boolean;
  status: Stripe.PaymentIntent.Status;
  connect_charge_type: "platform_direct" | "connected_account";
};

export function paymentIntentDebugSummary(
  paymentIntent: Stripe.PaymentIntent,
): PaymentIntentDebugSummary {
  const currency = paymentIntent.currency ?? "";
  const onBehalfOf =
    typeof paymentIntent.on_behalf_of === "string"
      ? paymentIntent.on_behalf_of
      : paymentIntent.on_behalf_of?.id ?? null;

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    amount_is_integer: Number.isInteger(paymentIntent.amount),
    currency,
    currency_is_lowercase: currency === currency.toLowerCase(),
    payment_method_types: paymentIntent.payment_method_types ?? [],
    automatic_payment_methods: paymentIntent.automatic_payment_methods ?? null,
    application_fee_amount: paymentIntent.application_fee_amount ?? null,
    transfer_data: paymentIntent.transfer_data ?? null,
    on_behalf_of: onBehalfOf,
    livemode: paymentIntent.livemode,
    status: paymentIntent.status,
    connect_charge_type: onBehalfOf ? "connected_account" : "platform_direct",
  };
}

export function logPaymentIntentDiagnostics(
  paymentIntent: Stripe.PaymentIntent,
  context: {
    carryRequestId: string;
    source: "created" | "reused";
    stripeSecretKeyPrefix: string;
  },
): PaymentIntentDebugSummary {
  const summary = paymentIntentDebugSummary(paymentIntent);

  console.info("create-payment-intent PaymentIntent diagnostics", {
    ...summary,
    carryRequestId: context.carryRequestId,
    source: context.source,
    stripe_secret_key_prefix: context.stripeSecretKeyPrefix,
    uses_connect_destination_on_intent: summary.connect_charge_type ===
      "connected_account",
    payment_method_types_card_only:
      summary.payment_method_types.length > 0 &&
      summary.payment_method_types.every((type) => type === "card"),
    automatic_payment_methods_enabled:
      summary.automatic_payment_methods?.enabled === true,
  });

  return summary;
}

export async function retrieveAndLogPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string,
  context: {
    carryRequestId: string;
    source: "created" | "reused";
    stripeSecretKeyPrefix: string;
  },
): Promise<PaymentIntentDebugSummary> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  console.info("create-payment-intent PaymentIntent retrieved immediately", {
    carryRequestId: context.carryRequestId,
    source: context.source,
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    payment_method_types: paymentIntent.payment_method_types ?? [],
    automatic_payment_methods: paymentIntent.automatic_payment_methods ?? null,
    application_fee_amount: paymentIntent.application_fee_amount ?? null,
    transfer_data: paymentIntent.transfer_data ?? null,
    on_behalf_of: paymentIntent.on_behalf_of ?? null,
    livemode: paymentIntent.livemode,
    status: paymentIntent.status,
  });

  return logPaymentIntentDiagnostics(paymentIntent, context);
}
