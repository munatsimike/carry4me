import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function uncommentedSql(sql) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

test("40000 depends on secrets table and does not weaken verify/payout", () => {
  const sql = uncommentedSql(
    read("supabase/migrations/20261011040000_email_queue_otp_leases.sql"),
  );
  const two = read(
    "supabase/migrations/20261011020000_restrict_carry_request_select_columns.sql",
  );
  const three = read(
    "supabase/migrations/20261011030000_delivery_otp_email_secrets.sql",
  );

  assert.match(sql, /delivery_otp_email_secrets/);
  assert.match(sql, /claim_email_queue_row/);
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /generate_secure_otp_6/);
  assert.doesNotMatch(sql, /drop function public\.verify_delivery_otp/i);
  assert.match(two, /delivery_otp_hash must not be in the authenticated SELECT allowlist/);
  assert.match(three, /create table if not exists public\.delivery_otp_email_secrets/);
});

test("generate-delivery-otp only reports sent after queue finish", () => {
  const generate = read("supabase/functions/generate-delivery-otp/index.ts");
  assert.match(generate, /emailStatusFromQueueResult/);
  assert.match(generate, /sent: emailStatus === "sent"/);
  assert.match(generate, /A new delivery code is being emailed to you/);
});
