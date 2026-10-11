import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isDesignatedStripeAdmin, parseAdminUserIds } from "./authorize.ts";

Deno.test("parseAdminUserIds splits commas and whitespace", () => {
  assertEquals(
    parseAdminUserIds(" 11111111-1111-1111-1111-111111111111, AAA "),
    ["11111111-1111-1111-1111-111111111111", "aaa"],
  );
});

Deno.test("parseAdminUserIds fails closed on empty secret", () => {
  assertEquals(parseAdminUserIds(null), []);
  assertEquals(parseAdminUserIds("  "), []);
});

Deno.test("isDesignatedStripeAdmin requires both admin type and allowlist", () => {
  const userId = "11111111-1111-1111-1111-111111111111";
  assertEquals(
    isDesignatedStripeAdmin({
      userId,
      profileType: "admin",
      allowlist: [userId],
    }),
    true,
  );
  assertEquals(
    isDesignatedStripeAdmin({
      userId,
      profileType: "ordinary",
      allowlist: [userId],
    }),
    false,
  );
  assertEquals(
    isDesignatedStripeAdmin({
      userId,
      profileType: "admin",
      allowlist: [],
    }),
    false,
  );
});
