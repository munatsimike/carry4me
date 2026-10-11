import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { collectCountedPages, collectStripePages } from "./paginate.ts";

Deno.test("collectStripePages walks starting_after until has_more is false", async () => {
  const calls: Array<{ limit: number; starting_after?: string }> = [];
  const result = await collectStripePages(
    async (params) => {
      calls.push(params);
      if (!params.starting_after) {
        return {
          data: [{ id: "po_1" }, { id: "po_2" }],
          has_more: true,
        };
      }
      assertEquals(params.starting_after, "po_2");
      return {
        data: [{ id: "po_3" }],
        has_more: false,
      };
    },
    { pageSize: 2, maxPages: 5 },
  );

  assertEquals(result.complete, true);
  assertEquals(result.items.map((item) => item.id), ["po_1", "po_2", "po_3"]);
  assertEquals(calls.length, 2);
  assertEquals(calls[0].limit, 2);
  assertEquals(calls[1].starting_after, "po_2");
});

Deno.test("collectStripePages fails closed when has_more remains after max pages", async () => {
  const result = await collectStripePages(
    async () => ({
      data: [{ id: "po_keep_going" }],
      has_more: true,
    }),
    { pageSize: 1, maxPages: 3 },
  );

  assertEquals(result.complete, false);
  assertEquals(result.items.length, 3);
});

Deno.test("collectStripePages fails closed when a page is malformed", async () => {
  const result = await collectStripePages(
    async () => ({ data: undefined as unknown as Array<{ id: string }>, has_more: true }),
    { maxPages: 2 },
  );

  assertEquals(result.complete, false);
  assertEquals(result.items.length, 0);
});

Deno.test("collectStripePages fails closed when has_more but last id is missing", async () => {
  const result = await collectStripePages(
    async () => ({
      data: [{ id: "   " }],
      has_more: true,
    }),
    { maxPages: 5 },
  );

  assertEquals(result.complete, false);
});

Deno.test("collectCountedPages walks every page of a large carry-request history", async () => {
  const all = Array.from({ length: 250 }, (_, index) => ({ id: `req_${index}` }));
  const result = await collectCountedPages(
    async (from, to) => ({
      data: all.slice(from, to + 1),
      count: all.length,
    }),
    { pageSize: 100, maxPages: 5 },
  );

  assertEquals(result.complete, true);
  assertEquals(result.items.length, 250);
  assertEquals(result.items[249].id, "req_249");
});

Deno.test("collectCountedPages fails closed when a page is silently truncated", async () => {
  const result = await collectCountedPages(
    async () => ({
      data: Array.from({ length: 50 }, (_, index) => ({ id: `req_${index}` })),
      count: 500,
    }),
    { pageSize: 100, maxPages: 10 },
  );

  assertEquals(result.complete, false);
  assertEquals(result.items.length, 0);
});

Deno.test("collectCountedPages fails closed when count is missing", async () => {
  const result = await collectCountedPages(
    async () => ({
      data: [{ id: "req_1" }],
      count: null,
    }),
    { pageSize: 100, maxPages: 3 },
  );

  assertEquals(result.complete, false);
});
