import type { ObligationBlock } from "./obligations.ts";
import type {
  CarryObligationLookup,
  ProfileResetResult,
  TargetConnectProfile,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseBlocker(value: unknown): ObligationBlock | null | "error" {
  if (value == null) return null;
  if (!isRecord(value)) return "error";
  const code = typeof value.code === "string" ? value.code.trim() : "";
  const message = typeof value.message === "string" ? value.message.trim() : "";
  if (!code || !message) return "error";
  return { code, message };
}

function parsePaymentIntentIds(value: unknown): string[] | "error" {
  if (!Array.isArray(value)) return "error";
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) return "error";
    ids.push(item.trim());
  }
  return ids;
}

export function parseObligationRpc(data: unknown): CarryObligationLookup | "error" {
  if (!isRecord(data)) return "error";
  if (data.complete !== true) {
    return { complete: false };
  }

  const blocker = parseBlocker(data.blocker);
  if (blocker === "error") return "error";

  const paymentIntentIds = parsePaymentIntentIds(data.payment_intent_ids);
  if (paymentIntentIds === "error") return "error";

  return {
    complete: true,
    blocker,
    paymentIntentIds,
  };
}

function parseProfile(value: unknown): TargetConnectProfile | "error" {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim()) {
    return "error";
  }

  return {
    id: value.id,
    email: typeof value.email === "string" ? value.email : null,
    full_name: typeof value.full_name === "string" ? value.full_name : null,
    phone_verified: value.phone_verified === true,
    email_verified: value.email_verified === true,
    country_code: typeof value.country_code === "string" ? value.country_code : null,
    country: typeof value.country === "string" ? value.country : null,
    stripe_account_id:
      typeof value.stripe_account_id === "string" ? value.stripe_account_id : null,
    stripe_charges_enabled: value.stripe_charges_enabled === true,
    stripe_payouts_enabled: value.stripe_payouts_enabled === true,
    stripe_details_submitted: value.stripe_details_submitted === true,
    stripe_verification_status:
      typeof value.stripe_verification_status === "string"
        ? value.stripe_verification_status
        : "not_started",
  };
}

export function parseProfileResetRpc(data: unknown): ProfileResetResult {
  if (!isRecord(data) || typeof data.outcome !== "string") return "error";

  if (data.outcome === "lock_lost") {
    return { outcome: "lock_lost" };
  }

  if (data.outcome === "error") return "error";

  const profile = parseProfile(data.profile);
  if (profile === "error") return "error";

  if (
    data.outcome === "cleared" ||
    data.outcome === "already_cleared" ||
    data.outcome === "replaced" ||
    data.outcome === "unchanged"
  ) {
    return { outcome: data.outcome, profile };
  }

  return "error";
}

export function parseBooleanRpc(data: unknown): boolean | "error" {
  if (typeof data === "boolean") return data;
  return "error";
}
