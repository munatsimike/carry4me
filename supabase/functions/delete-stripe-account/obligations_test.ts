import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  classifyDbObligations,
  classifyStripeBalance,
  classifyStripePayouts,
  classifyStripeRefunds,
  classifyStripeTransfers,
  type CarryRequestObligationRow,
} from "./obligations.ts";

function settledRow(
  overrides: Partial<CarryRequestObligationRow> = {},
): CarryRequestObligationRow {
  return {
    id: "req-settled",
    status: "PAID_OUT",
    payment_status: "SUCCEEDED",
    stripe_transfer_id: "tr_1",
    stripe_refund_id: null,
    refund_status: null,
    stripe_dispute_id: null,
    dispute_status: null,
    stripe_payment_intent_id: "pi_1",
    ...overrides,
  };
}

Deno.test("classifyDbObligations finds a blocker after thousands of settled rows", () => {
  const rows = Array.from({ length: 5000 }, (_, index) =>
    settledRow({ id: `req_${index}`, stripe_payment_intent_id: `pi_${index}` })
  );
  rows.push(
    settledRow({
      id: "req_blocker",
      status: "PENDING_PAYOUT",
      stripe_transfer_id: null,
    }),
  );

  const block = classifyDbObligations(rows);
  assertEquals(block?.code, "ACTIVE_CARRY_REQUEST");
});

Deno.test("missing Stripe balance is an error, not a zero balance", () => {
  const block = classifyStripeBalance(null);
  assertEquals(block?.code, "OBLIGATION_CHECK_FAILED");
});

Deno.test("malformed Stripe balance without available/pending arrays is an error", () => {
  const block = classifyStripeBalance({ pending: [{ amount: 0 }] });
  assertEquals(block?.code, "OBLIGATION_CHECK_FAILED");
});

Deno.test("zero Stripe balance with required arrays is allowed", () => {
  const block = classifyStripeBalance({
    available: [{ amount: 0 }],
    pending: [{ amount: 0 }],
  });
  assertEquals(block, null);
});

Deno.test("outstanding Stripe balance still blocks deletion", () => {
  const block = classifyStripeBalance({
    available: [],
    pending: [{ amount: 1200 }],
  });
  assertEquals(block?.code, "STRIPE_BALANCE_OUTSTANDING");
});

Deno.test("completed transfers do not block deletion", () => {
  const block = classifyStripeTransfers([
    { reversed: false, amount: 2500, amount_reversed: 0 },
  ]);
  assertEquals(block, null);
});

Deno.test("fully reversed transfers do not block deletion", () => {
  const block = classifyStripeTransfers([
    { reversed: true, amount: 2500, amount_reversed: 2500 },
  ]);
  assertEquals(block, null);
});

Deno.test("partially reversed transfers block deletion", () => {
  const block = classifyStripeTransfers([
    { reversed: false, amount: 2500, amount_reversed: 400 },
  ]);
  assertEquals(block?.code, "UNSETTLED_TRANSFER");
});

Deno.test("malformed transfer amounts fail closed", () => {
  const block = classifyStripeTransfers([
    { amount: Number.NaN, amount_reversed: 0 },
  ]);
  assertEquals(block?.code, "OBLIGATION_CHECK_FAILED");
});

Deno.test("succeeded Stripe refunds do not block deletion", () => {
  const block = classifyStripeRefunds([{ status: "succeeded" }]);
  assertEquals(block, null);
});

Deno.test("pending Stripe refunds still block deletion", () => {
  const block = classifyStripeRefunds([{ status: "pending" }]);
  assertEquals(block?.code, "PENDING_REFUND");
});

Deno.test("malformed Stripe refund status fails closed", () => {
  const block = classifyStripeRefunds([{ status: null }]);
  assertEquals(block?.code, "OBLIGATION_CHECK_FAILED");
});

Deno.test("paid Stripe payouts do not block deletion", () => {
  const block = classifyStripePayouts([{ status: "paid" }]);
  assertEquals(block, null);
});
