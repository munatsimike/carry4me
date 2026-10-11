import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const migrationPath = path.join(
  here,
  "../migrations/20261011020000_restrict_carry_request_select_columns.sql",
);
const repositoryPath = path.join(
  root,
  "apps/web/src/app/features/carry request/data/SupabaseCarryRequestRepository.ts",
);
const helperPath = path.join(
  root,
  "apps/web/src/app/shared/Authentication/domain/SupabaseHelper.ts",
);
const realtimePath = path.join(
  root,
  "apps/web/src/app/hooks/useCarryRequestRealtimeSync.ts",
);

const CLIENT_SELECT_STAR_ON_CARRY_REQUESTS =
  /\.from\(\s*["']carry_requests["']\s*\)[\s\S]{0,500}?\.select\(\s*["']\*["']/;

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function uncommentedSql(sql) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

test("migration revokes table SELECT and excludes delivery_otp_hash", () => {
  const sql = read(migrationPath);
  const liveSql = uncommentedSql(sql);

  assert.match(sql, /revoke all on table public\.carry_requests from public/);
  assert.match(sql, /revoke all on table public\.carry_requests from anon/);
  assert.match(
    sql,
    /revoke all on table public\.carry_requests from authenticated/,
  );
  assert.match(
    sql,
    /revoke select \(%I\) on table public\.carry_requests from public, anon, authenticated/,
  );
  assert.match(
    sql,
    /grant insert on table public\.carry_requests to authenticated/,
  );
  assert.match(
    sql,
    /grant select, insert, update, delete on table public\.carry_requests to service_role/,
  );
  assert.doesNotMatch(
    liveSql,
    /grant select, insert on table public\.carry_requests to authenticated/i,
  );
  assert.match(
    sql,
    /delivery_otp_hash must not be in the authenticated SELECT allowlist/,
  );
  assert.match(
    sql,
    /grant select \(%s\) on table public\.carry_requests to authenticated/,
  );
  assert.match(
    liveSql,
    /revoke all on function public\.hash_delivery_otp\(uuid, text\) from public, anon, authenticated/,
  );
  assert.match(
    liveSql,
    /revoke all on function public\.issue_delivery_otp\(uuid\) from public, anon, authenticated/,
  );
  assert.match(
    liveSql,
    /grant execute on function public\.verify_delivery_otp\(uuid, text\) to authenticated, service_role/,
  );

  const allowlistMatch = sql.match(
    /allowlist text\[\] := array\[([\s\S]*?)\];/,
  );
  assert.ok(allowlistMatch, "missing explicit allowlist array");
  const allowlist = allowlistMatch[1];
  assert.equal(
    allowlist.includes("'delivery_otp_hash'"),
    false,
    "allowlist must not include delivery_otp_hash",
  );
  for (const col of [
    "id",
    "status",
    "stripe_payment_intent_id",
    "delivery_otp_expires_at",
    "payment_preference",
  ]) {
    assert.equal(allowlist.includes(`'${col}'`), true, `allowlist missing ${col}`);
  }
});

test("web queries do not select delivery_otp_hash or carry_requests *", () => {
  const repo = read(repositoryPath);
  const helper = read(helperPath);
  const realtime = read(realtimePath);

  assert.equal(repo.includes("delivery_otp_hash"), false);
  assert.equal(helper.includes("delivery_otp_hash"), false);
  assert.equal(CLIENT_SELECT_STAR_ON_CARRY_REQUESTS.test(repo), false);
  assert.equal(CLIENT_SELECT_STAR_ON_CARRY_REQUESTS.test(helper), false);

  assert.equal(repo.includes("stripe_payment_intent_id"), true);
  assert.equal(repo.includes("delivery_otp_expires_at"), true);
  assert.equal(repo.includes("events:carry_request_events(*)"), true);

  assert.equal(realtime.includes('table: "carry_requests"'), true);
  assert.equal(realtime.includes("delivery_otp_hash"), false);
});

test("frontend listing columns are all on the authenticated allowlist", () => {
  const sql = read(migrationPath);
  const repo = read(repositoryPath);
  const allowlistMatch = sql.match(
    /allowlist text\[\] := array\[([\s\S]*?)\];/,
  );
  assert.ok(allowlistMatch);
  const allowlisted = new Set(
    [...allowlistMatch[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]),
  );

  const listingSelect = repo.match(/\.select\(\s*`([\s\S]*?)`\s*\)/);
  assert.ok(listingSelect, "missing listing select template");
  const requested = listingSelect[1]
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter((line) => /^[a-z_]+$/.test(line));

  for (const col of requested) {
    assert.equal(
      allowlisted.has(col),
      true,
      `frontend selects ${col} which is not on the allowlist`,
    );
  }
});
