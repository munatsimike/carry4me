import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseObligationRpc, parseProfileResetRpc } from "./rpcParse.ts";

Deno.test("obligation RPC parser fails closed on malformed payloads", () => {
  assertEquals(parseObligationRpc(null), "error");
  assertEquals(parseObligationRpc("nope"), "error");
  assertEquals(parseObligationRpc({ complete: true }), "error");
  assertEquals(
    parseObligationRpc({
      complete: true,
      blocker: { code: "ACTIVE_CARRY_REQUEST" },
      payment_intent_ids: [],
    }),
    "error",
  );
  assertEquals(
    parseObligationRpc({
      complete: true,
      blocker: null,
      payment_intent_ids: [1, "pi_1"],
    }),
    "error",
  );
});

Deno.test("obligation RPC parser treats incomplete results as incomplete, not empty", () => {
  assertEquals(parseObligationRpc({ complete: false }), { complete: false });
});

Deno.test("obligation RPC parser keeps a blocker even with thousands of payment intents", () => {
  const paymentIntentIds = Array.from({ length: 5000 }, (_, index) => `pi_${index}`);
  const parsed = parseObligationRpc({
    complete: true,
    blocker: {
      code: "UNSETTLED_PAYOUT",
      message: "This traveler still has an unsettled payout.",
    },
    payment_intent_ids: paymentIntentIds,
  });

  assertEquals(parsed === "error", false);
  if (parsed === "error" || !parsed.complete) {
    throw new Error("expected a complete obligation lookup");
  }
  assertEquals(parsed.blocker?.code, "UNSETTLED_PAYOUT");
  assertEquals(parsed.paymentIntentIds.length, 5000);
});

Deno.test("profile reset RPC parser maps lock_lost without a profile payload", () => {
  assertEquals(parseProfileResetRpc({ outcome: "lock_lost" }), {
    outcome: "lock_lost",
  });
  assertEquals(parseProfileResetRpc({ outcome: "cleared" }), "error");
});
