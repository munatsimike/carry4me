import { AppError } from "@/app/shared/domain/AppError";
import { toFriendlyErrorMessage } from "./normalizeSupabaseError";

export const EMAIL_OTP_USE_PHONE_MESSAGE =
  "Account not found or incomplete. Sign in with Phone OTP.";

export function isEmailOtpAccountUnavailableError(error: unknown): boolean {
  const appError = AppError.fromUnknown(error);
  if (appError.code === "ACCOUNT_NOT_FOUND") return true;

  const normalized = appError.message.toLowerCase();
  return (
    normalized.includes("account not found") ||
    normalized.includes("incomplete") ||
    normalized.includes("sign in with phone otp") ||
    normalized.includes("email not verified") ||
    normalized.includes("not verified") ||
    normalized.includes("signups not allowed") ||
    normalized.includes("user not found") ||
    normalized.includes("no user found")
  );
}

export function toEmailOtpLoginErrorMessage(
  error: unknown,
  fallback = "We couldn't send an email code right now. Please try again.",
): string {
  if (isEmailOtpAccountUnavailableError(error)) {
    return EMAIL_OTP_USE_PHONE_MESSAGE;
  }

  const message = toFriendlyErrorMessage(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many")
  ) {
    return "Please wait a moment before requesting another code.";
  }

  return message || fallback;
}
