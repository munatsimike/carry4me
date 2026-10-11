import {
  ACTIVE_CARRY_REQUEST_STATUSES,
  CLOSED_DISPUTE_STATUSES,
  REFUNDED_PAYMENT_STATUSES,
  TERMINAL_UNPAID_STATUSES,
} from "./constants.ts";

export type CarryRequestObligationRow = {
  id: string;
  status: string | null;
  payment_status: string | null;
  stripe_transfer_id: string | null;
  stripe_refund_id: string | null;
  refund_status: string | null;
  stripe_dispute_id: string | null;
  dispute_status: string | null;
  stripe_payment_intent_id: string | null;
};

export type ObligationBlock = {
  code: string;
  message: string;
};

const ACTIVE = new Set<string>(ACTIVE_CARRY_REQUEST_STATUSES);
const TERMINAL_UNPAID = new Set<string>(TERMINAL_UNPAID_STATUSES);
const REFUNDED = new Set<string>(REFUNDED_PAYMENT_STATUSES);
const CLOSED_DISPUTE = new Set<string>(CLOSED_DISPUTE_STATUSES);

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function classifyDbObligations(
  rows: CarryRequestObligationRow[],
): ObligationBlock | null {
  for (const row of rows) {
    const status = row.status ?? "";
    const paymentStatus = row.payment_status ?? "";

    if (ACTIVE.has(status)) {
      return {
        code: "ACTIVE_CARRY_REQUEST",
        message: "This traveler still has an active carry request.",
      };
    }

    if (hasText(row.stripe_dispute_id) && !CLOSED_DISPUTE.has(row.dispute_status ?? "")) {
      return {
        code: "UNRESOLVED_DISPUTE",
        message: "This traveler has an unresolved payment dispute.",
      };
    }

    if (
      hasText(row.stripe_refund_id) &&
      !REFUNDED.has(paymentStatus)
    ) {
      return {
        code: "PENDING_REFUND",
        message: "A refund is still pending on a request for this traveler.",
      };
    }

    if (hasText(row.refund_status) && !REFUNDED.has(paymentStatus)) {
      return {
        code: "PENDING_REFUND",
        message: "A refund is still pending on a request for this traveler.",
      };
    }

    const payoutOwed =
      paymentStatus === "SUCCEEDED" &&
      !hasText(row.stripe_transfer_id) &&
      !TERMINAL_UNPAID.has(status) &&
      !REFUNDED.has(paymentStatus);

    if (payoutOwed) {
      return {
        code: "UNSETTLED_PAYOUT",
        message: "This traveler still has an unsettled payout.",
      };
    }

    if (hasText(row.stripe_transfer_id) && ACTIVE.has(status)) {
      return {
        code: "UNSETTLED_TRANSFER",
        message: "A traveler payout transfer is still in progress.",
      };
    }
  }

  return null;
}

function isAmountBucket(value: unknown): value is Array<{ amount?: number }> {
  return Array.isArray(value);
}

export function classifyStripeBalance(balance: {
  available?: unknown;
  pending?: unknown;
  connect_reserved?: unknown;
} | null | undefined): ObligationBlock | null {
  if (!balance || typeof balance !== "object") {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify the Stripe account balance.",
    };
  }

  if (!isAmountBucket(balance.available) || !isAmountBucket(balance.pending)) {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Stripe account balance data was missing or malformed.",
    };
  }

  if (
    balance.connect_reserved !== undefined &&
    !isAmountBucket(balance.connect_reserved)
  ) {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Stripe account balance data was missing or malformed.",
    };
  }

  const buckets = [
    ...balance.available,
    ...balance.pending,
    ...(isAmountBucket(balance.connect_reserved) ? balance.connect_reserved : []),
  ];

  if (buckets.some((item) => Math.abs(Number(item?.amount ?? 0)) > 0)) {
    return {
      code: "STRIPE_BALANCE_OUTSTANDING",
      message: "The Stripe Connect account still has a balance.",
    };
  }

  return null;
}

export function classifyStripePayouts(
  payouts: Array<{ status?: string | null }> | null | undefined,
): ObligationBlock | null {
  if (!payouts) {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify Stripe payouts for this account.",
    };
  }

  const blocking = payouts.some((payout) => {
    const status = payout.status?.toLowerCase() ?? "";
    return status === "pending" || status === "in_transit";
  });

  if (blocking) {
    return {
      code: "PENDING_STRIPE_PAYOUT",
      message: "The Stripe Connect account has a payout in progress.",
    };
  }

  return null;
}

export function classifyStripeTransfers(
  transfers: Array<{ reversed?: boolean; amount?: number; amount_reversed?: number }> | null | undefined,
): ObligationBlock | null {
  if (!transfers) {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify Stripe transfers for this account.",
    };
  }

  for (const transfer of transfers) {
    const amount = Number(transfer.amount ?? 0);
    const reversed = Number(transfer.amount_reversed ?? 0);
    if (!Number.isFinite(amount) || !Number.isFinite(reversed) || reversed < 0) {
      return {
        code: "OBLIGATION_CHECK_FAILED",
        message: "Stripe transfer data was missing or malformed.",
      };
    }
    if (reversed > 0 && reversed < amount) {
      return {
        code: "UNSETTLED_TRANSFER",
        message: "The Stripe Connect account has an unsettled transfer reversal.",
      };
    }
  }

  return null;
}

export function classifyStripeRefunds(
  refunds: Array<{ status?: string | null }> | null | undefined,
): ObligationBlock | null {
  if (!refunds) {
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Could not verify Stripe refunds for this account.",
    };
  }

  for (const refund of refunds) {
    const status = refund.status?.toLowerCase() ?? "";
    if (status === "pending" || status === "requires_action") {
      return {
        code: "PENDING_REFUND",
        message: "A Stripe refund is still pending for this traveler.",
      };
    }
    if (
      status === "succeeded" ||
      status === "failed" ||
      status === "canceled" ||
      status === "cancelled"
    ) {
      continue;
    }
    return {
      code: "OBLIGATION_CHECK_FAILED",
      message: "Stripe refund data was missing or malformed.",
    };
  }

  return null;
}
