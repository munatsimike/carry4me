import type { ObligationBlock } from "./obligations.ts";
import {
  classifyStripeBalance,
  classifyStripePayouts,
  classifyStripeRefunds,
  classifyStripeTransfers,
} from "./obligations.ts";
import type { PagedStripeResult } from "./paginate.ts";

export type StripeDeleteAdapter = {
  retrieveAccount: (accountId: string) => Promise<{ id: string } | "missing">;
  getBalance: (accountId: string) => Promise<{
    available?: unknown;
    pending?: unknown;
    connect_reserved?: unknown;
  }>;
  listPayouts: (
    accountId: string,
  ) => Promise<PagedStripeResult<{ status?: string | null }>>;
  listTransfers: (
    accountId: string,
  ) => Promise<
    PagedStripeResult<{ reversed?: boolean; amount?: number; amount_reversed?: number }>
  >;
  listRefunds: (
    paymentIntentIds: string[],
  ) => Promise<PagedStripeResult<{ status?: string | null }>>;
  deleteAccount: (accountId: string) => Promise<{ deleted: boolean }>;
};

function incompleteStripeList(message: string): ObligationBlock {
  return {
    code: "OBLIGATION_CHECK_FAILED",
    message,
  };
}

export async function checkStripeObligations(
  stripe: StripeDeleteAdapter,
  accountId: string,
  paymentIntentIds: string[],
): Promise<ObligationBlock | null> {
  let account: { id: string } | "missing";
  try {
    account = await stripe.retrieveAccount(accountId);
  } catch {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not load the Stripe Connect account.",
    };
  }

  if (account === "missing") {
    return {
      code: "STRIPE_ACCOUNT_MISSING",
      message: "The Stripe Connect account is already absent in Stripe.",
    };
  }

  try {
    const balance = await stripe.getBalance(accountId);
    const balanceBlock = classifyStripeBalance(balance);
    if (balanceBlock) return balanceBlock;
  } catch {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify the Stripe account balance.",
    };
  }

  try {
    const payouts = await stripe.listPayouts(accountId);
    if (!payouts?.complete) {
      return incompleteStripeList("Could not load the full Stripe payout list.");
    }
    const payoutBlock = classifyStripePayouts(payouts.items);
    if (payoutBlock) return payoutBlock;
  } catch {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify Stripe payouts for this account.",
    };
  }

  try {
    const transfers = await stripe.listTransfers(accountId);
    if (!transfers?.complete) {
      return incompleteStripeList("Could not load the full Stripe transfer list.");
    }
    const transferBlock = classifyStripeTransfers(transfers.items);
    if (transferBlock) return transferBlock;
  } catch {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify Stripe transfers for this account.",
    };
  }

  try {
    const refunds = await stripe.listRefunds(paymentIntentIds);
    if (!refunds?.complete) {
      return incompleteStripeList("Could not load the full Stripe refund list.");
    }
    const refundBlock = classifyStripeRefunds(refunds.items);
    if (refundBlock) return refundBlock;
  } catch {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify Stripe refunds for this account.",
    };
  }

  return null;
}
