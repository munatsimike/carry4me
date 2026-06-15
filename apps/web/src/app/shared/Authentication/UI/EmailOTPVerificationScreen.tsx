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
import { useSignInModal } from "../SignInModalContext";
import { toFriendlyErrorMessage } from "../application/normalizeSupabaseError";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";

const otpSchema = z.object({
  otpCode: otpCodeSchema,
});

type OTPFormValues = z.infer<typeof otpSchema>;

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

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
    normalizedRaw.includes("incorrect code") ||
    normalizedBase.includes("invalid otp") ||
    normalizedBase.includes("invalid token")
  ) {
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

interface EmailOTPVerificationScreenProps {
  onVerificationComplete: () => void;
}

export function EmailOTPVerificationScreen({
  onVerificationComplete,
}: EmailOTPVerificationScreenProps) {
  const { state, openSignInModal } = useSignInModal();
  const email = (state.emailOtpAddress ?? "").trim().toLowerCase();
  const authRepo = new SupabaseAuthRepository();

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
      await authRepo.verifyEmailOTP(email, values.otpCode.trim());
      onVerificationComplete();
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : toEmailOtpErrorMessage(
          err,
          "We couldn't verify your email code right now. Please try again.",
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
      await authRepo.sendEmailOTP(email);
      setResendTimer(60);
    } catch (err) {
      setSubmitError(
        toEmailOtpErrorMessage(
          err,
          "We couldn't send a new email code right now. Please try again.",
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
