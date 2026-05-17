import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { CircleBadge } from "@/components/ui/CircleBadge";
import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import ErrorText from "@/app/components/text/ErrorText";
import Spinner from "@/app/components/Spinner";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { VerifyPhoneOTPUseCase } from "../application/VerifyPhoneOTPUseCase";
import { SendPhoneOTPUseCase } from "../application/SendPhoneOTPUseCase";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import { toFriendlyErrorMessage } from "../application/normalizeSupabaseError";
import { ShieldCheck } from "lucide-react";
import { otpCodeSchema } from "@/app/shared/validation/formValidation";

const otpSchema = z.object({
  otpCode: otpCodeSchema,
});

type OTPFormValues = z.infer<typeof otpSchema>;

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

interface OTPVerificationScreenProps {
  onVerificationComplete: () => void;
  onPhoneEdit: () => void;
}

export function OTPVerificationScreen({
  onVerificationComplete,
  onPhoneEdit,
}: OTPVerificationScreenProps) {
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
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const {
    phoneNumber,
    selectedCountryCode,
    setStep,
    setLoading,
    setError,
  } = usePhoneVerification();
  const { showSupabaseError } = useUniversalModal();
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const verifyOTPUseCase = useMemo(
    () => new VerifyPhoneOTPUseCase(authRepo),
    [authRepo],
  );
  const sendOTPUseCase = useMemo(
    () => new SendPhoneOTPUseCase(authRepo),
    [authRepo],
  );

  useEffect(() => {
    setSubmitError(null);
  }, [otpCode]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async (values: OTPFormValues) => {
    if (!selectedCountryCode) {
      setError("Select a country code before verifying your phone number.");
      setStep("phone-entry");
      return;
    }

    setLoading(true);
    try {
      await verifyOTPUseCase.execute(
        phoneNumber,
        values.otpCode,
        selectedCountryCode,
      );
      setStep("completed");
      onVerificationComplete();
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
      showSupabaseError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await sendOTPUseCase.execute(phoneNumber);
      setResendTimer(60);
    } catch (err) {
      showSupabaseError(err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto items-center gap-3 px-4 sm:px-0">
      <motion.div variants={item} className="flex items-center justify-center">
        <ErrorText error={submitError?.toString()}>
          <span className="inline-flex flex-col gap-1 items-center">
            <CircleBadge size="lg">
              <ShieldCheck className="text-primary-500" size={24} />
            </CircleBadge>
            <CustomText as="h1" textVariant="primary" textSize="lg" className="font-medium">
              Verify your phone
            </CustomText>
            <CustomText as="p" textVariant="label" textSize="sm">
              We sent a 6-digit code to <strong>{phoneNumber}</strong>
            </CustomText>
          </span>
        </ErrorText>
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
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative"
          variant={"primary"}
          size={"sm"}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              <span className="ml-2">Verifying...</span>
            </>
          ) : (
            "Verify phone number"
          )}
        </Button>
      </motion.form>

      <motion.div variants={item} className="flex flex-col gap-3 w-full">
        <LineDivider heightClass="my-0" />

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPhoneEdit}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit phone number
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
