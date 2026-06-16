import { AppError, type AppErrorShape } from "../../domain/AppError";

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

export type ModalAction = "retry" | "signIn" | "close";

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

function getErrorCode(error: unknown): string | undefined {
  // direct code
  if (typeof error === "string") {
    return error;
  }

  if (!isRecord(error)) return undefined;

  const code = error["code"];
  return typeof code === "string" ? code : undefined;
}

function normalizeText(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

export function normalizeSupabaseError(
  error: AppError | AppErrorShape,
): NormalizedError {
  const appError = error instanceof AppError ? error : AppError.fromUnknown(error);
  const message = appError.message;
  const code = getErrorCode(appError.code);
  const normalizedMessage = normalizeText(message);
  const normalizedCode = normalizeText(code);

  if (
    normalizedCode === "account_not_found" ||
    includesAny(normalizedMessage, [
      "account not found",
      "incomplete",
      "sign in with phone otp",
      "email not verified",
      "signups not allowed",
    ])
  ) {
    return {
      category: "AUTH",
      title: "Account unavailable",
      message: "Account not found or incomplete. Sign in with Phone OTP.",
      action: "signIn",
    };
  }

  if (
    !error ||
    includesAny(normalizedMessage, [
      "failed to fetch",
      "networkerror",
      "authretryablefetcherror",
      "request timed out",
      "load failed",
    ])
  ) {
    return {
      category: "NETWORK",
      title: "Connection problem",
      message:
        "We couldn't reach the server. Check your internet connection and try again.",
      action: "retry",
    };
  }

  if (
    includesAny(normalizedCode, [
      "otp_expired",
      "otp_invalid",
      "invalid_otp",
      "invalid_token",
      "token_expired",
      "bad_jwt",
    ]) ||
    includesAny(normalizedMessage, [
      "otp expired",
      "otp has expired",
      "token has expired",
      "invalid otp",
      "invalid token",
      "token is invalid",
      "email link is invalid",
      "phone change token",
    ])
  ) {
    return {
      category: "AUTH",
      title: "Verification code issue",
      message: "The verification code is invalid or has expired. Request a new code and try again.",
      action: "retry",
    };
  }

  if (
    includesAny(normalizedCode, [
      "sms_send_failed",
      "phone_provider_disabled",
      "phone_not_confirmed",
    ]) ||
    includesAny(normalizedMessage, [
      "sms",
      "phone provider",
      "unable to send",
      "failed to send",
    ])
  ) {
    return {
      category: "AUTH",
      title: "Couldn’t send code",
      message: "We couldn’t send a verification code right now. Check the phone number and try again.",
      action: "retry",
    };
  }

  if (
    includesAny(normalizedCode, [
      "user_already_exists",
      "email_exists",
      "email_address_already_exists",
      "phone_exists",
      "phone_number_already_exists",
      "identity_already_exists",
      "23505",
    ]) ||
    includesAny(normalizedMessage, [
      "already registered",
      "already exists",
      "duplicate key",
      "unique constraint",
      "duplicate phone",
      "duplicate email",
    ])
  ) {
    if (includesAny(normalizedMessage, ["phone", "phone_number"])) {
      return {
        category: "CONFLICT",
        title: "Phone number already used",
        message: "This phone number is already linked to an account. Use a different number or sign in.",
        action: "signIn",
      };
    }

    return {
      category: "CONFLICT",
      title: "Account already exists",
      message: "These details are already linked to an account. Please sign in instead.",
      action: "signIn",
    };
  }

  if (
    includesAny(normalizedCode, ["42501", "403", "rls"]) ||
    includesAny(normalizedMessage, [
      "row-level security",
      "violates row-level security",
      "permission denied",
      "not authorized",
      "forbidden",
      "account suspended",
      "account_suspended",
    ])
  ) {
    return {
      category: "FORBIDDEN",
      title: "Action not allowed",
      message: "You don’t have permission to complete this action.",
      action: "close",
    };
  }

  if (
    includesAny(normalizedCode, [
      "over_request_rate_limit",
      "over_email_send_rate_limit",
      "over_sms_send_rate_limit",
      "too_many_requests",
      "429",
    ]) ||
    includesAny(normalizedMessage, [
      "rate limit",
      "too many requests",
      "too many attempts",
      "for security purposes",
    ])
  ) {
    return {
      category: "RATE_LIMIT",
      title: "Too many attempts",
      message: "Please wait a moment before trying again.",
      action: "retry",
    };
  }

  if (
    includesAny(normalizedMessage, [
      "invalid phone",
      "phone number is invalid",
      "invalid email",
      "email address is invalid",
      "invalid input",
      "invalid format",
    ])
  ) {
    return {
      category: "VALIDATION",
      title: "Check your details",
      message: "Some information doesn’t look right. Please check it and try again.",
      action: "close",
    };
  }

  // HTTP first
  switch (appError.status ?? undefined) {
    case 401:
      return {
        category: "AUTH",
        title: "Session expired",
        message: "Please sign in again.",
        action: "signIn",
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
        title: "Check your details",
        message: "Some information doesn’t look right. Please check it and try again.",
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
        message: "These details are already in use. Try using a different value.",
        action: "signIn",
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
    case "23000":
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
        title: "Action not allowed",
        message: "You don’t have permission to do this.",
        action: "close",
      };

    // Auth / user errors
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
        title: "Couldn’t sign in",
        message: "We couldn’t verify those details. Please check them and try again.",
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
    case "otp_invalid":
    case "invalid_otp":
    case "invalid_token":
      return {
        category: "AUTH",
        title: "Verification code issue",
        message: "The verification code is invalid or has expired. Request a new code and try again.",
        action: "retry",
      };

    case "over_request_rate_limit":
    case "over_sms_send_rate_limit":
    case "over_email_send_rate_limit":
      return {
        category: "RATE_LIMIT",
        title: "Too many attempts",
        message: "Please wait a moment before trying again.",
        action: "retry",
      };

    case "user_already_exists":
    case "email_exists":
    case "email_address_already_exists":
    case "identity_already_exists":
      return {
        category: "CONFLICT",
        title: "Account already exists",
        message: "These details are already linked to an account. Please sign in instead.",
        action: "signIn",
      };

    case "phone_exists":
    case "phone_number_already_exists":
      return {
        category: "CONFLICT",
        title: "Phone number already used",
        message: "This phone number is already linked to an account. Use a different number or sign in.",
        action: "signIn",
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

export function toFriendlyErrorMessage(error: unknown): string {
  return normalizeSupabaseError(AppError.fromUnknown(error)).message;
}

/** Carry4Me email verification edge-function / verify-email page codes */
export function normalizeEmailVerificationError(
  code?: string,
): NormalizedError {
  const normalizedCode = normalizeText(code);

  switch (normalizedCode) {
    case "email_verified":
      return {
        category: "AUTH",
        title: "Email verified",
        message:
          "Your email has been verified. Taking you to the dashboard…",
        action: "close",
      };

    case "already_verified":
      return {
        category: "AUTH",
        title: "Email already verified",
        message:
          "Your email is already verified. Taking you to the dashboard…",
        action: "close",
      };

    case "link_already_used":
      return {
        category: "AUTH",
        title: "Link already used",
        message:
          "This verification link has already been used. If your email is verified, sign in. Otherwise request a new verification email from your profile.",
        action: "signIn",
      };

    case "link_expired":
      return {
        category: "AUTH",
        title: "Link expired",
        message:
          "This verification link has expired. Sign in and request a new verification email from your dashboard.",
        action: "signIn",
      };

    case "token_required":
    case "invalid_body":
      return {
        category: "VALIDATION",
        title: "Invalid link",
        message:
          "This verification link is not valid. Request a new verification email and try again.",
        action: "close",
      };

    case "email_verify_failed":
      return {
        category: "SERVER",
        title: "Verification problem",
        message:
          "We could not verify your email right now. Please try again in a moment.",
        action: "retry",
      };

    default:
      return {
        category: "UNKNOWN",
        title: "Verification problem",
        message:
          "We could not verify your email. Request a new verification email and try again.",
        action: "close",
      };
  }
}
