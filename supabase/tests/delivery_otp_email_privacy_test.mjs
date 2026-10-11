import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  deliveryOtpNotificationMetadata,
  isSixDigitOtp,
  parseIssueDeliveryOtpRpc,
  redactOtpDigits,
} from "../functions/_shared/deliveryOtpMailLogic.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function uncommentedSql(sql) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

test("issue RPC parser never forwards otp digits", () => {
  const leaked = parseIssueDeliveryOtpRpc({
    ok: true,
    otp: "123456",
    notification_id: "n1",
  });
  assert.equal(leaked.ok, true);
  assert.equal(leaked.notification_id, "n1");
  assert.equal("otp" in leaked, false);

  assert.deepEqual(parseIssueDeliveryOtpRpc({ ok: false, reason: "RATE_LIMITED" }), {
    ok: false,
    reason: "RATE_LIMITED",
  });
});

test("notification metadata builder omits otp", () => {
  const metadata = deliveryOtpNotificationMetadata("req-1", "handover");
  assert.equal("otp" in metadata, false);
  assert.equal(metadata.carry_request_id, "req-1");
  assert.equal(isSixDigitOtp("123456"), true);
  assert.equal(isSixDigitOtp("12a456"), false);
  assert.equal(redactOtpDigits("code 123456 sent"), "code [otp] sent");
});

test("migration stores OTP only in secrets and strips notification metadata", () => {
  const sql = uncommentedSql(
    read("supabase/migrations/20261011030000_delivery_otp_email_secrets.sql"),
  );

  assert.match(sql, /create table if not exists public\.delivery_otp_email_secrets/);
  assert.match(
    sql,
    /revoke all on table public\.delivery_otp_email_secrets from public/,
  );
  assert.match(
    sql,
    /revoke all on table public\.delivery_otp_email_secrets from authenticated/,
  );
  assert.match(sql, /grant select, insert, update, delete on table public\.delivery_otp_email_secrets to service_role/);
  assert.match(sql, /insert into public\.delivery_otp_email_secrets \(notification_id, otp\)/);
  assert.match(sql, /metadata = metadata - 'otp'/);
  assert.match(sql, /interval '60 seconds'/);
  assert.doesNotMatch(
    sql,
    /jsonb_build_object\(\s*'carry_request_id',\s*p_request_id,\s*'otp'/,
  );
  assert.doesNotMatch(sql, /'otp',\s*v_otp/);
  assert.match(sql, /hash_delivery_otp/);
});

test("email worker and resend path do not read notification metadata.otp", () => {
  const enrichment = read(
    "supabase/functions/_shared/emails/notificationEmailEnrichment.ts",
  );
  const generate = read("supabase/functions/generate-delivery-otp/index.ts");
  const processor = read("supabase/functions/_shared/emailQueueProcessor.ts");
  const helper = read("apps/web/src/app/shared/listings/paymentPreference.ts");
  const mapper = read(
    "apps/web/src/app/features/carry request/ui/CarryRequestMapper.tsx",
  );

  assert.equal(enrichment.includes("metadata?.otp"), false);
  assert.equal(generate.includes("dev_otp"), false);
  assert.equal(generate.includes("otp: issued"), false);
  assert.match(processor, /peekDeliveryOtpSecret/);
  assert.match(processor, /deleteDeliveryOtpSecret/);
  assert.match(helper, /We're sending a delivery code to your email/);
  assert.match(helper, /A delivery code was sent to your email/);
  assert.match(helper, /We couldn't email your delivery code/);
  assert.equal(/\d{6}/.test(helper.match(/senderPaymentCodeHelperText[\s\S]*?`([^`]+)`/)?.[1] ?? ""), false);
  assert.match(mapper, /We're sending a delivery code to your email/);
});
