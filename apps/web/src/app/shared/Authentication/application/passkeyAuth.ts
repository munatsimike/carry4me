import { AppError } from "@/app/shared/domain/AppError";
import { supabase } from "@/app/shared/supabase/client";

export type PasskeyCredentialSummary = {
  id: string;
  friendlyName?: string | null;
  createdAt?: string | null;
};

export type PasskeySupportCheck = {
  supported: boolean;
  reason?: string;
  detail?: unknown;
};

function toPasskeyErrorMessage(err: unknown): string {
  const message = AppError.fromUnknown(err).message || "Passkey action failed.";
  const lower = message.toLowerCase();

  if (lower.includes("abort") || lower.includes("cancel")) {
    return "Passkey action was cancelled.";
  }

  if (lower.includes("not support") || lower.includes("webauthn")) {
    return "Passkeys are not supported on this browser or device.";
  }

  return message;
}

function requireBrowserPasskeySupport() {
  if (typeof window === "undefined" || !("PublicKeyCredential" in window)) {
    throw new AppError({
      message: "Passkeys are not supported on this browser or device.",
      code: "PASSKEY_NOT_SUPPORTED",
    });
  }
}

export async function checkPasskeyBrowserSupport(): Promise<PasskeySupportCheck> {
  if (typeof window === "undefined") {
    return {
      supported: false,
      reason: "window_unavailable",
      detail: "Window object is not available.",
    };
  }

  if (!("PublicKeyCredential" in window)) {
    return {
      supported: false,
      reason: "webauthn_unavailable",
      detail: "PublicKeyCredential is not available in this browser.",
    };
  }

  const publicKeyCredential = window.PublicKeyCredential as
    | (typeof PublicKeyCredential & {
      isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
    })
    | undefined;

  if (
    !publicKeyCredential ||
    typeof publicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
      "function"
  ) {
    return {
      supported: false,
      reason: "platform_authenticator_check_unavailable",
      detail:
        "Browser does not expose isUserVerifyingPlatformAuthenticatorAvailable.",
    };
  }

  try {
    const available =
      await publicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    if (!available) {
      return {
        supported: false,
        reason: "platform_authenticator_unavailable",
        detail: "No user-verifying platform authenticator is available.",
      };
    }

    return { supported: true };
  } catch (err) {
    return {
      supported: false,
      reason: "platform_authenticator_check_failed",
      detail: err,
    };
  }
}

export async function signInWithPasskey() {
  requireBrowserPasskeySupport();

  const auth = supabase.auth as unknown as {
    signInWithPasskey?: () => Promise<{ data: unknown; error: unknown }>;
  };

  if (!auth.signInWithPasskey) {
    throw new AppError({
      message:
        "Passkey sign-in is not available in this app build. Please update the app.",
      code: "PASSKEY_API_UNAVAILABLE",
    });
  }

  const { data, error } = await auth.signInWithPasskey();
  if (error) {
    throw new AppError({ message: toPasskeyErrorMessage(error) });
  }

  return data;
}

export async function enrollPasskey() {
  requireBrowserPasskeySupport();

  const auth = supabase.auth as unknown as {
    registerPasskey?: () => Promise<{ data: unknown; error: unknown }>;
  };

  if (!auth.registerPasskey) {
    throw new AppError({
      message:
        "Passkey enrollment is not available in this app build. Please update the app.",
      code: "PASSKEY_API_UNAVAILABLE",
    });
  }

  const { data, error } = await auth.registerPasskey();
  if (error) {
    throw new AppError({ message: toPasskeyErrorMessage(error) });
  }

  return data;
}

export async function listPasskeys(): Promise<PasskeyCredentialSummary[]> {
  const auth = supabase.auth as unknown as {
    passkey?: {
      list?: () => Promise<{
        data: { passkeys?: PasskeyCredentialSummary[] } | PasskeyCredentialSummary[] | null;
        error: unknown;
      }>;
    };
  };

  const listFn = auth.passkey?.list;
  if (!listFn) return [];

  const { data, error } = await listFn();
  if (error) {
    throw new AppError({ message: toPasskeyErrorMessage(error) });
  }

  if (Array.isArray(data)) return data;
  return data?.passkeys ?? [];
}

export async function removePasskey(passkeyId: string): Promise<void> {
  const auth = supabase.auth as unknown as {
    passkey?: {
      delete?: (
        arg: string | { id: string },
      ) => Promise<{ data: unknown; error: unknown }>;
    };
  };

  const deleteFn = auth.passkey?.delete;
  if (!deleteFn) {
    throw new AppError({
      message: "Passkey removal is not supported in this app build.",
      code: "PASSKEY_DELETE_UNAVAILABLE",
    });
  }

  let result = await deleteFn(passkeyId);
  if (result.error) {
    result = await deleteFn({ id: passkeyId });
  }

  if (result.error) {
    throw new AppError({ message: toPasskeyErrorMessage(result.error) });
  }
}
