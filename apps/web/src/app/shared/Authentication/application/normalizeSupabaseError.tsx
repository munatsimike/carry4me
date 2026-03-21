// src/application/errors/types.ts
export type ErrorCategory =
  | "NETWORK"
  | "AUTH"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "SERVER"
  | "UNKNOWN";

export type ModalAction = "retry" | "login" | "close";

export interface NormalizedError {
  category: ErrorCategory;
  title: string;
  message: string;
  action?: ModalAction;
}

// src/application/errors/supabase-error-mapper.ts

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (!isRecord(error)) return undefined;

  const msg = error["message"];
  return typeof msg === "string" ? msg : undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined;

  const code = error["code"];
  return typeof code === "string" ? code : undefined;
}

export function normalizeSupabaseError(
  error: unknown,
  status?: number | null,
): NormalizedError {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  // Network-ish
  if (!error || (message && message.includes("Failed to fetch"))) {
    return {
      category: "NETWORK",
      title: "Connection problem",
      message:
        "We couldn't reach the server. Check your internet connection and try again.",
      action: "retry",
    };
  }

  // HTTP first
  switch (status ?? undefined) {
    case 401:
      return {
        category: "AUTH",
        title: "Session expired",
        message: "Please sign in again.",
        action: "login",
      };
    case 403:
      return {
        category: "FORBIDDEN",
        title: "Access denied",
        message: "You don't have permission to do that.",
        action: "close",
      };
    case 404:
      return {
        category: "NOT_FOUND",
        title: "Not found",
        message: "We couldn't find what you were looking for.",
        action: "close",
      };
    case 429:
      return {
        category: "RATE_LIMIT",
        title: "Too many requests",
        message: "Please wait a moment and try again.",
        action: "retry",
      };
    case 400:
    case 422:
      return {
        category: "VALIDATION",
        title: "Invalid request",
        message: "Some information was invalid. Please try again.",
        action: "close",
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        category: "SERVER",
        title: "Server error",
        message: "Something went wrong on our side. Please try again.",
        action: "retry",
      };
  }

  switch (code) {
    // Postgres / database errors
    case "23505":
      return {
        category: "CONFLICT",
        title: "Already exists",
        message: "This already exists. Try using a different value.",
        action: "close",
      };

    case "23503":
      return {
        category: "VALIDATION",
        title: "Invalid selection",
        message: "Some selected data is no longer available.",
        action: "close",
      };

    case "23502":
      return {
        category: "VALIDATION",
        title: "Missing information",
        message: "Please fill in all required fields.",
        action: "close",
      };

    case "23514":
      return {
        category: "VALIDATION",
        title: "Invalid input",
        message: "One or more values are not allowed.",
        action: "close",
      };

    case "22P02":
      return {
        category: "VALIDATION",
        title: "Invalid format",
        message: "Please check the format of your input.",
        action: "close",
      };

    case "22001":
      return {
        category: "VALIDATION",
        title: "Too long",
        message: "One of the values is too long.",
        action: "close",
      };

    case "42501":
      return {
        category: "FORBIDDEN",
        title: "Not allowed",
        message: "You don’t have permission to do this.",
        action: "close",
      };

    // Auth / user errors
    case "same_password":
      return {
        category: "VALIDATION",
        title: "Choose a new password",
        message: "Your new password must be different from your current one.",
        action: "close",
      };

    case "weak_password":
      return {
        category: "VALIDATION",
        title: "Weak password",
        message:
          "Use a stronger password with a mix of letters, numbers, or symbols.",
        action: "close",
      };

    case "password_mismatch":
      return {
        category: "VALIDATION",
        title: "Passwords don’t match",
        message: "Please make sure both password fields match.",
        action: "close",
      };

    case "invalid_credentials":
      return {
        category: "AUTH",
        title: "Incorrect email or password",
        message: "Please check your details and try again.",
        action: "retry",
      };

    case "email_not_confirmed":
      return {
        category: "AUTH",
        title: "Email not confirmed",
        message: "Check your email and confirm your account to continue.",
        action: "retry",
      };

    case "user_not_found":
      return {
        category: "AUTH",
        title: "No account found",
        message: "We couldn’t find an account with those details.",
        action: "close",
      };

    case "session_not_found":
    case "no_session":
      return {
        category: "AUTH",
        title: "Session expired",
        message: "Please open the link again or request a new one.",
        action: "retry",
      };

    case "invalid_refresh_token":
      return {
        category: "AUTH",
        title: "Session expired",
        message: "Please sign in again to continue.",
        action: "retry",
      };

    case "otp_expired":
      return {
        category: "AUTH",
        title: "Link expired",
        message: "This link has expired. Request a new one to continue.",
        action: "retry",
      };

    case "over_request_rate_limit":
      return {
        category: "RATE_LIMIT",
        title: "Too many attempts",
        message: "Please wait a moment before trying again.",
        action: "close",
      };

    default:
      return {
        category: "UNKNOWN",
        title: "Unexpected error",
        message: "An unexpected error occurred. Please try again.",
        action: "retry",
      };
  }
}
