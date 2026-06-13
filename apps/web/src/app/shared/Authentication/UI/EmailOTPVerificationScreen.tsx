import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import Spinner from "@/app/components/Spinner";
import { otpCodeSchema } from "@/app/shared/validation/formValidation";
import { supabase } from "@/app/shared/supabase/client";
import { useSignInModal } from "../SignInModalContext";
import { toFriendlyErrorMessage } from "../application/normalizeSupabaseError";

const otpSchema = z.object({
  otpCode: otpCodeSchema,
});

type OTPFormValues = z.infer<typeof otpSchema>;

type EmailOtpFunctionErrorPayload = {
  error?: string;
  retry_after_seconds?: number;
};

type ResponseLike = {
  status?: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

async function readEmailOtpFunctionError(
  err: unknown,
): Promise<{ message?: string; retryAfterSeconds?: number; status?: number; rawMessage?: string }> {
  const rawMessage = err instanceof Error
    ? err.message
    : typeof err === "string"
      ? err
      : undefined;

  if (!err || typeof err !== "object" || !("context" in err)) {
    return { rawMessage };
  }

  const context = (err as { context?: unknown }).context as ResponseLike | undefined;
  if (!context || typeof context !== "object") {
    return { rawMessage };
  }

  let message: string | undefined;
  let retryAfterSeconds: number | undefined;
  try {
    if (typeof context.json === "function") {
      const payload = (await context.json()) as EmailOtpFunctionErrorPayload;
      if (typeof payload.error === "string") {
        message = payload.error;
      }
      if (typeof payload.retry_after_seconds === "number") {
        retryAfterSeconds = payload.retry_after_seconds;
      }
    }
  } catch {
    try {
      if (typeof context.text === "function") {
        const textBody = await context.text();
        if (textBody.trim()) {
          message = textBody.trim();
        }
      }
    } catch {
      // Ignore unreadable payloads and use fallbacks.
    }
  }

  return {
    message,
    retryAfterSeconds,
    status: typeof context.status === "number" ? context.status : undefined,
    rawMessage,
  };
}

function toEmailOtpErrorMessage(err: unknown, fallbackMessage: string): string {
  const fallback = fallbackMessage.trim();
  const base = toFriendlyErrorMessage(err);
  const rawMessage = err instanceof Error
    ? err.message
    : typeof err === "string"
      ? err
      : "";
  const normalizedRaw = rawMessage.toLowerCase();
  const normalizedBase = base.toLowerCase();

  if (
    normalizedRaw.includes("code has expired") ||
    normalizedRaw.includes("expired")
  ) {
    return "This email code has expired. Request a new code and try again.";
  }

  if (
    normalizedRaw.includes("invalid code") ||
    normalizedRaw.includes("incorrect code")
  ) {
    const attemptsMatch = normalizedRaw.match(/(\d+)\s+attempt/);
    if (attemptsMatch) {
      const attempts = Number(attemptsMatch[1]);
      if (Number.isFinite(attempts)) {
        return `That email code is incorrect. ${attempts} attempt${attempts === 1 ? "" : "s"} remaining.`;
      }
    }
    return "That email code is incorrect. Please check and try again.";
  }

  if (normalizedRaw.includes("maximum attempts")) {
    return "Too many incorrect attempts. Request a new email code and try again.";
  }

  if (normalizedRaw.includes("no active code")) {
    return "No active email code found. Request a new code.";
  }

  if (
    normalizedRaw.includes("not linked to your existing account") ||
    normalizedRaw.includes("sign in with phone otp first")
  ) {
    return "Account not found or incomplete. Sign in with Phone OTP.";
  }

  if (normalizedRaw.includes("already linked to another account")) {
    return "Account not found or incomplete. Sign in with Phone OTP.";
  }

  if (normalizedRaw.includes("account not found")) {
    return "Account not found or incomplete. Sign in with Phone OTP.";
  }

  if (normalizedRaw.includes("could not complete sign-in")) {
    return "Could not complete email sign-in. Please use Phone OTP.";
  }

  if (normalizedBase.includes("phone number")) return fallback;

  if (
    normalizedBase.includes("rate limit") ||
    normalizedBase.includes("too many") ||
    normalizedBase.includes("wait a moment")
  ) {
    return "Please wait a moment before requesting another code.";
  }

  return base || fallback;
}

export function EmailOTPVerificationScreen() {
  const { state, openSignInModal } = useSignInModal();
  const email = (state.emailOtpAddress ?? "").trim().toLowerCase();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    mode: "onTouched",
  });

  const otpCode = watch("otpCode");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  useEffect(() => {
    setSubmitError(null);
  }, [otpCode]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const handleVerifyOTP = async (values: OTPFormValues) => {
    if (!email) {
      setSubmitError("Missing email address. Please go back and request a new code.");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        action_link?: string;
      }>("verify-email-login-otp", {
        body: { email, otp: values.otpCode.trim() },
        method: "POST",
      });

      if (error) {
        const detail = await readEmailOtpFunctionError(error);
        throw new Error(
          toEmailOtpErrorMessage(
            detail.message
              ? new Error(detail.message)
              : detail.rawMessage
                ? new Error(detail.rawMessage)
                : error,
            "We couldn’t verify your email code right now. Please try again.",
          ),
        );
      }

      if (!data?.action_link) {
        throw new Error("Could not complete sign-in.");
      }

      window.location.href = data.action_link;
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : toEmailOtpErrorMessage(
          err,
          "We couldn’t verify your email code right now. Please try again.",
        );
      setSubmitError(message);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setSubmitError("Missing email address. Please go back and request a new code.");
      return;
    }

    setResendLoading(true);
    setSubmitError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        cooldown_seconds?: number;
      }>("send-email-login-otp", {
        body: { email },
        method: "POST",
      });

      if (error) {
        const detail = await readEmailOtpFunctionError(error);
        if (typeof detail.retryAfterSeconds === "number" && detail.retryAfterSeconds > 0) {
          setResendTimer(Math.max(1, Math.ceil(detail.retryAfterSeconds)));
          return;
        }
        throw new Error(
          toEmailOtpErrorMessage(
            detail.message ? new Error(detail.message) : error,
            "We couldn’t send a new email code right now. Please try again.",
          ),
        );
      }

      setResendTimer(data?.cooldown_seconds ?? 60);
    } catch (err) {
      setSubmitError(
        toEmailOtpErrorMessage(
          err,
          "We couldn’t send a new email code right now. Please try again.",
        ),
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto items-center gap-3 px-4 sm:px-0">
      <motion.div variants={item} className="flex items-center justify-center">
        <span className="inline-flex flex-col gap-1 items-center">
          <CustomText as="h1" textVariant="primary" textSize="lg" className="font-medium">
            Verify your email
          </CustomText>
          <CustomText as="p" textVariant="label" textSize="sm" className="text-center">
            We sent a 6-digit code to <strong>{email || "your email"}</strong>
          </CustomText>
        </span>
      </motion.div>

      <motion.div variants={item} className="w-full">
        <LineDivider heightClass="my-0" />
      </motion.div>

      <motion.form
        variants={item}
        onSubmit={handleSubmit(handleVerifyOTP)}
        className="w-full flex flex-col gap-4"
      >
        <div className="flex justify-center">
          <div className="flex flex-col gap-2">
            <CustomText as="label" textVariant="label" textSize="xs">
              Verification code
            </CustomText>
            <FloatingInputField
              hasValue={!!otpCode}
              placeholder="000000"
              {...register("otpCode")}
              disabled={isSubmitting}
              error={errors.otpCode?.message}
              isDirty={dirtyFields.otpCode ?? false}
              isTouched={!!touchedFields.otpCode}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
            {submitError ? (
              <CustomText textSize="xs" className="text-red-600">
                {submitError}
              </CustomText>
            ) : null}
          </div>
        </div>

        <LineDivider heightClass="my-0" />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative"
          variant="primary"
          size="sm"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              <span className="ml-2">Verifying...</span>
            </>
          ) : (
            "Verify email code"
          )}
        </Button>
      </motion.form>

      <motion.div variants={item} className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => openSignInModal({
              redirectTo: state.redirectTo,
              defaultTab: "email",
            })}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Use a different email
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendTimer > 0 || resendLoading}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendLoading
              ? "Sending..."
              : resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : "Resend code"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
