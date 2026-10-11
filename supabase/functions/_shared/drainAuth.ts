/**
 * Drain authentication for process-email-queue.
 * Never trust a decoded JWT payload without cryptographic verification.
 */

export const DRAIN_CLOCK_SKEW_SECONDS = 30;

export type DrainJwk = {
  kty?: string;
  kid?: string;
  alg?: string;
  crv?: string;
  x?: string;
  y?: string;
  n?: string;
  e?: string;
  use?: string;
};

export type DrainAuthConfig = {
  serviceRoleKey: string;
  jwtSecret?: string | null;
  jwks?: { keys: DrainJwk[] } | null;
  projectRef: string;
  supabaseUrl: string;
  nowSeconds?: number;
  /** Platform-verified privilege probe; must not trust decoded JWT claims. */
  privilegedProbe?: (token: string) => Promise<boolean>;
};

export function projectRefFromSupabaseUrl(supabaseUrl: string): string {
  try {
    const host = new URL(supabaseUrl).hostname;
    return host.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function parseJwksJson(raw: string | null | undefined): {
  keys: DrainJwk[];
} | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { keys?: DrainJwk[] };
    if (!parsed?.keys || !Array.isArray(parsed.keys)) return null;
    return { keys: parsed.keys };
  } catch {
    return null;
  }
}

export async function isServiceRoleDrainToken(
  token: string,
  config: DrainAuthConfig,
): Promise<boolean> {
  if (!token) return false;
  if (timingSafeEqualString(token, config.serviceRoleKey)) return true;

  const jwtParts = token.split(".");
  const looksLikeJwt = jwtParts.length === 3;

  if (looksLikeJwt) {
    const verified = await verifySignedJwt(token, config);
    if (verified.status === "verified") {
      return claimsAreServiceRole(verified.claims, config);
    }
    if (verified.status === "rejected") {
      return false;
    }
  }

  if (config.privilegedProbe) {
    try {
      return await config.privilegedProbe(token) === true;
    } catch {
      return false;
    }
  }
  return false;
}

const PRIVILEGE_PROBE_RPC = "email_queue_lease_is_active";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/** Cryptographic JWT checks are done by PostgREST using the project secret. */
export async function probeServiceRoleWithProjectJwt(
  supabaseUrl: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const res = await fetchImpl(
    `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/${PRIVILEGE_PROBE_RPC}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: token,
      },
      body: JSON.stringify({
        p_id: ZERO_UUID,
        p_lease_token: ZERO_UUID,
      }),
    },
  );
  return res.ok;
}

export function claimsAreServiceRole(
  claims: Record<string, unknown>,
  config: DrainAuthConfig,
): boolean {
  if (claims.role !== "service_role") return false;

  const now = config.nowSeconds ?? Math.floor(Date.now() / 1000);
  const exp = asFiniteNumber(claims.exp);
  if (exp == null || exp + DRAIN_CLOCK_SKEW_SECONDS <= now) return false;
  const nbf = asFiniteNumber(claims.nbf);
  if (nbf != null && nbf - DRAIN_CLOCK_SKEW_SECONDS > now) return false;

  const ref = typeof claims.ref === "string" ? claims.ref : "";
  if (config.projectRef && ref && ref !== config.projectRef) return false;

  const issuer = typeof claims.iss === "string" ? claims.iss : "";
  if (issuer && !issuerAllowed(issuer, config)) return false;

  if (!audienceAllowed(claims.aud)) return false;

  return true;
}

function issuerAllowed(issuer: string, config: DrainAuthConfig): boolean {
  const origin = config.supabaseUrl.replace(/\/+$/, "");
  const allowed = new Set([
    "supabase",
    `${origin}/auth/v1`,
    `https://${config.projectRef}.supabase.co/auth/v1`,
  ]);
  return allowed.has(issuer);
}

function audienceAllowed(aud: unknown): boolean {
  const values = Array.isArray(aud) ? aud : [aud];
  const allowed = values.filter((value): value is string =>
    typeof value === "string" && value.length > 0
  );
  if (allowed.length === 0) return true;
  return allowed.some((value) => value === "authenticated" || value === "service_role");
}

type VerifyJwtResult =
  | { status: "verified"; claims: Record<string, unknown> }
  | { status: "rejected" }
  | { status: "unavailable" };

async function verifySignedJwt(
  token: string,
  config: DrainAuthConfig,
): Promise<VerifyJwtResult> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return { status: "rejected" };
  }

  let header: { alg?: string; kid?: string };
  try {
    header = JSON.parse(bytesToString(base64UrlToBytes(parts[0]))) as {
      alg?: string;
      kid?: string;
    };
  } catch {
    return { status: "rejected" };
  }

  const alg = header.alg;
  if (!alg || alg.toLowerCase() === "none") {
    return { status: "rejected" };
  }

  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  let signature: Uint8Array;
  try {
    signature = base64UrlToBytes(parts[2]);
  } catch {
    return { status: "rejected" };
  }

  let ok = false;
  if (alg === "HS256") {
    const secret = config.jwtSecret?.trim();
    if (!secret) return { status: "unavailable" };
    ok = await verifyHs256(signingInput, signature, secret);
  } else if (alg === "ES256") {
    const jwk = selectJwk(config.jwks?.keys ?? [], header.kid, "EC");
    if (!jwk) return { status: "unavailable" };
    ok = await verifyEs256(signingInput, signature, jwk);
  } else {
    return { status: "rejected" };
  }
  if (!ok) return { status: "rejected" };

  try {
    const payload = JSON.parse(bytesToString(base64UrlToBytes(parts[1])));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { status: "rejected" };
    }
    return { status: "verified", claims: payload as Record<string, unknown> };
  } catch {
    return { status: "rejected" };
  }
}

async function verifyHs256(
  data: Uint8Array,
  signature: Uint8Array,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("HMAC", key, signatureToBuffer(signature), data);
}

async function verifyEs256(
  data: Uint8Array,
  signature: Uint8Array,
  jwk: DrainJwk,
): Promise<boolean> {
  if (!jwk.x || !jwk.y || jwk.kty !== "EC") return false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      {
        kty: "EC",
        crv: jwk.crv || "P-256",
        x: jwk.x,
        y: jwk.y,
        ext: true,
      },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signatureToBuffer(signature),
      data,
    );
  } catch {
    return false;
  }
}

function selectJwk(
  keys: DrainJwk[],
  kid: string | undefined,
  kty: string,
): DrainJwk | null {
  const usable = keys.filter((key) => key.kty === kty);
  if (kid) {
    const match = usable.find((key) => key.kid === kid);
    if (match) return match;
    return null;
  }
  return usable[0] ?? null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function timingSafeEqualString(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const len = Math.max(a.length, b.length, 1);
  const aa = new Uint8Array(len);
  const bb = new Uint8Array(len);
  aa.set(a);
  bb.set(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= aa[i] ^ bb[i];
  }
  return diff === 0;
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function signatureToBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
