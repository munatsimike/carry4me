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
import { SendPhoneOTPUseCase } from "../application/SendPhoneOTPUseCase";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import { namedCall } from "../application/NamedCall";
import { ShieldCheck } from "lucide-react";

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im,
      "Enter a valid phone number format",
    ),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

interface PhoneEntryScreenProps {
  onPhoneSubmitted: () => void;
}

export function PhoneEntryScreen({ onPhoneSubmitted }: PhoneEntryScreenProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    mode: "onTouched",
  });

  const phoneNumber = watch("phoneNumber");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { setPhoneNumber, setStep, setLoading, setError } =
    usePhoneVerification();
  const { showSupabaseError } = useUniversalModal();

  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const sendOTPUseCase = useMemo(
    () => new SendPhoneOTPUseCase(authRepo),
    [authRepo],
  );

  useEffect(() => {
    setSubmitError(null);
  }, [phoneNumber]);

  const handleSendOTP = async (values: PhoneFormValues) => {
    setLoading(true);
    const { result } = await namedCall(
      "sendPhoneOTP",
      sendOTPUseCase.execute(values.phoneNumber),
    );

    if (!result.success) {
      setError(result.error.message || "Failed to send OTP");
      showSupabaseError(result.error);
      setLoading(false);
      return;
    }

    // Store phone number and move to OTP verification step
    setPhoneNumber(values.phoneNumber);
    setStep("otp-verification");
    setLoading(false);
    onPhoneSubmitted();
  };

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto items-center gap-5 px-4 sm:px-0">
      <motion.div variants={item} className="flex items-center justify-center">
        <ErrorText error={submitError?.toString()}>
          <span className="inline-flex flex-col gap-2 items-center">
            <CircleBadge size="lg">
              <ShieldCheck className="text-primary-500" size={28} />
            </CircleBadge>
            <CustomText as="h1" textVariant="primary" textSize="xl">
              Verify Your Phone
            </CustomText>
            <CustomText as="p" textVariant="label" textSize="sm">
              We'll send you a code via SMS to verify your phone number.
            </CustomText>
          </span>
        </ErrorText>
      </motion.div>

      <motion.div variants={item} className="w-full">
        <LineDivider heightClass="my-0" />
      </motion.div>

      <motion.form
        variants={item}
        onSubmit={handleSubmit(handleSendOTP)}
        className="w-full flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2 justify-center items-center">
          <CustomText as="label" textVariant="label" textSize="sm">
            Phone Number
          </CustomText>
          <FloatingInputField
            hasValue
            placeholder="Enter your phone number"
            {...register("phoneNumber")}
            disabled={isSubmitting}
            error={errors.phoneNumber?.message}
            isDirty={dirtyFields.phoneNumber ?? false}
            isTouched={!!touchedFields.phoneNumber}
            helperText="Include country code (e.g., +1234567890)"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative mb-3"
          variant={"primary"}
          size={"sm"}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              <span className="ml-2">Sending OTP...</span>
            </>
          ) : (
            "Send Verification Code"
          )}
        </Button>
      </motion.form>
    </div>
  );
}
