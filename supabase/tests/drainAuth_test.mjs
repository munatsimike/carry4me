import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const drainAuthPath = path.resolve(
  here,
  "../functions/_shared/drainAuth.ts",
);
const processPath = path.resolve(
  here,
  "../functions/process-email-queue/index.ts",
);

const { isServiceRoleDrainToken, claimsAreServiceRole } = await import(
  pathToFileURL(drainAuthPath).href
);

const encoder = new TextEncoder();

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlJson(value) {
  return b64url(encoder.encode(JSON.stringify(value)));
}

async function hs256(tokenWithoutSig, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(tokenWithoutSig),
  );
  return b64url(new Uint8Array(sig));
}

async function signHs256(payload, secret, header = { alg: "HS256", typ: "JWT" }) {
  const unsigned = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  return `${unsigned}.${await hs256(unsigned, secret)}`;
}

const secret = "test-jwt-secret-value";
const otherSecret = "other-jwt-secret-value";
const serviceRoleKey = "sb_secret_test_service_role_key";
const baseConfig = {
  serviceRoleKey,
  jwtSecret: secret,
  jwks: { keys: [] },
  projectRef: "ohnxdykqpakpeqerowkl",
  supabaseUrl: "https://ohnxdykqpakpeqerowkl.supabase.co",
  nowSeconds: 1_700_000_000,
};

const validClaims = {
  role: "service_role",
  ref: "ohnxdykqpakpeqerowkl",
  iss: "supabase",
  aud: "authenticated",
  iat: 1_699_999_000,
  exp: 1_700_000_600,
};

test("exact service role key match is accepted", async () => {
  assert.equal(
    await isServiceRoleDrainToken(serviceRoleKey, baseConfig),
    true,
  );
});

test("unsigned alg=none JWT with role=service_role is rejected", async () => {
  const token = `${b64urlJson({ alg: "none", typ: "JWT" })}.${
    b64urlJson(validClaims)
  }.`;
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), false);
});

test("HS256 JWT signed with the wrong secret is rejected", async () => {
  const token = await signHs256(validClaims, otherSecret);
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), false);
});

test("verified HS256 JWT with role=anon is rejected", async () => {
  const token = await signHs256({ ...validClaims, role: "anon" }, secret);
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), false);
});

test("verified HS256 JWT with role=authenticated is rejected", async () => {
  const token = await signHs256(
    { ...validClaims, role: "authenticated", sub: "user-1" },
    secret,
  );
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), false);
});

test("verified HS256 JWT that is expired is rejected", async () => {
  const token = await signHs256({ ...validClaims, exp: 1_699_999_000 }, secret);
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), false);
});

test("verified HS256 JWT with the wrong project ref is rejected", async () => {
  const token = await signHs256({ ...validClaims, ref: "otherprojectxxxx" }, secret);
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), false);
});

test("verified HS256 JWT with a disallowed issuer is rejected", async () => {
  const token = await signHs256({ ...validClaims, iss: "https://evil.example" }, secret);
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), false);
});

test("verified HS256 service_role JWT is accepted", async () => {
  const token = await signHs256(validClaims, secret);
  assert.equal(await isServiceRoleDrainToken(token, baseConfig), true);
});

test("HS256 JWT is rejected when no jwt secret is configured", async () => {
  const token = await signHs256(validClaims, secret);
  assert.equal(
    await isServiceRoleDrainToken(token, { ...baseConfig, jwtSecret: null }),
    false,
  );
});

test("malformed tokens are rejected", async () => {
  assert.equal(await isServiceRoleDrainToken("not-a-jwt", baseConfig), false);
  assert.equal(await isServiceRoleDrainToken("a.b", baseConfig), false);
  assert.equal(await isServiceRoleDrainToken("", baseConfig), false);
});

test("platform privilege probe is not used when local JWT verification fails unless provided", async () => {
  const token = await signHs256(validClaims, secret);
  assert.equal(
    await isServiceRoleDrainToken(token, { ...baseConfig, jwtSecret: null }),
    false,
  );
});

test("platform privilege probe accepts only an ok probe after crypto checks fail locally", async () => {
  const token = await signHs256(validClaims, secret);
  assert.equal(
    await isServiceRoleDrainToken(token, {
      ...baseConfig,
      jwtSecret: null,
      privilegedProbe: async () => false,
    }),
    false,
  );
  assert.equal(
    await isServiceRoleDrainToken(token, {
      ...baseConfig,
      jwtSecret: null,
      privilegedProbe: async () => true,
    }),
    true,
  );
});

test("unsigned tokens are not accepted just because a probe exists", async () => {
  const token = `${b64urlJson({ alg: "none", typ: "JWT" })}.${
    b64urlJson(validClaims)
  }.`;
  assert.equal(
    await isServiceRoleDrainToken(token, {
      ...baseConfig,
      privilegedProbe: async () => true,
    }),
    false,
  );
});

test("wrong-secret HS256 JWT is not accepted via privilege probe", async () => {
  const token = await signHs256(validClaims, otherSecret);
  assert.equal(
    await isServiceRoleDrainToken(token, {
      ...baseConfig,
      privilegedProbe: async () => true,
    }),
    false,
  );
});

test("opaque API key can be accepted only via privilege probe", async () => {
  assert.equal(
    await isServiceRoleDrainToken("sb_secret_not_the_env_key", {
      ...baseConfig,
      privilegedProbe: async () => true,
    }),
    true,
  );
  assert.equal(
    await isServiceRoleDrainToken("sb_secret_not_the_env_key", {
      ...baseConfig,
      privilegedProbe: async () => false,
    }),
    false,
  );
});

test("claims helper requires role, expiry, and project binding", () => {
  assert.equal(claimsAreServiceRole(validClaims, baseConfig), true);
  assert.equal(
    claimsAreServiceRole({ ...validClaims, role: "authenticated" }, baseConfig),
    false,
  );
});

test("process-email-queue no longer trusts a decoded role claim", () => {
  const drain = readFileSync(processPath, "utf8");
  const helper = readFileSync(drainAuthPath, "utf8");
  assert.match(drain, /isServiceRoleDrainToken/);
  assert.doesNotMatch(drain, /payload\.role === "service_role"/);
  assert.doesNotMatch(drain, /JSON\.parse\(atob/);
  assert.match(helper, /verifySignedJwt/);
  assert.match(helper, /verifyHs256/);
  assert.match(helper, /timingSafeEqualString/);
  assert.doesNotMatch(
    helper,
    /return payload\.role === "service_role"/,
  );
});
