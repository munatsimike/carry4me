import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { isMissingStripeAccountError } from "../_shared/stripe/errors.ts";
import { STRIPE_LIST_PAGE_SIZE } from "./constants.ts";
import { collectStripePages } from "./paginate.ts";
import type { StripeDeleteAdapter } from "./stripeAdapter.ts";

export function createStripeAdapter(stripe: Stripe): StripeDeleteAdapter {
  return {
    async retrieveAccount(accountId) {
      try {
        const account = await stripe.accounts.retrieve(accountId);
        return { id: account.id };
      } catch (err) {
        if (isMissingStripeAccountError(err)) return "missing";
        throw err;
      }
    },

    async getBalance(accountId) {
      return await stripe.balance.retrieve({
        stripeAccount: accountId,
      });
    },

    async listPayouts(accountId) {
      return await collectStripePages((params) =>
        stripe.payouts.list(
          {
            limit: params.limit ?? STRIPE_LIST_PAGE_SIZE,
            ...(params.starting_after
              ? { starting_after: params.starting_after }
              : {}),
          },
          { stripeAccount: accountId },
        )
      );
    },

    async listTransfers(accountId) {
      return await collectStripePages((params) =>
        stripe.transfers.list({
          destination: accountId,
          limit: params.limit ?? STRIPE_LIST_PAGE_SIZE,
          ...(params.starting_after
            ? { starting_after: params.starting_after }
            : {}),
        })
      );
    },

    async listRefunds(paymentIntentIds) {
      if (paymentIntentIds.length === 0) {
        return { items: [], complete: true };
      }

      const items: Array<{ status?: string | null }> = [];
      for (const paymentIntentId of paymentIntentIds) {
        const page = await collectStripePages((params) =>
          stripe.refunds.list({
            payment_intent: paymentIntentId,
            limit: params.limit ?? STRIPE_LIST_PAGE_SIZE,
            ...(params.starting_after
              ? { starting_after: params.starting_after }
              : {}),
          })
        );
        if (!page.complete) {
          return { items, complete: false };
        }
        items.push(...page.items);
      }
      return { items, complete: true };
    },

    async deleteAccount(accountId) {
      try {
        const result = await stripe.accounts.del(accountId);
        return { deleted: result.deleted === true };
      } catch (err) {
        if (isMissingStripeAccountError(err)) {
          return { deleted: true };
        }
        throw err;
      }
    },
  };
}
