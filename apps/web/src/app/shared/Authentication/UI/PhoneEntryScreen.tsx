import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import ErrorText from "@/app/components/text/ErrorText";
import Spinner from "@/app/components/Spinner";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { SendPhoneOTPUseCase } from "../application/SendPhoneOTPUseCase";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import { AppError } from "@/app/shared/domain/AppError";
import { META_ICONS } from "@/app/icons/MetaIcon";
import SvgIcon from "@/components/ui/SvgIcon";
import { phoneNumberSchema } from "@/app/shared/validation/formValidation";

const phoneSchema = z.object({
  phoneNumber: phoneNumberSchema,
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
    try {
      await sendOTPUseCase.execute(values.phoneNumber);
      setPhoneNumber(values.phoneNumber);
      setStep("otp-verification");
      onPhoneSubmitted();
    } catch (err) {
      setError(AppError.fromUnknown(err).message);
      showSupabaseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto items-center gap-4 px-4 sm:px-0">
      <motion.div variants={item} className="flex items-center justify-center">
        <ErrorText error={submitError?.toString()}>
          <span className="inline-flex flex-col gap-1 items-center">
            <SvgIcon size={"xl"} Icon={META_ICONS.loginIcon} color="primary" />

            <CustomText
              as="h1"
              textVariant="primary"
              textSize="xl"
              className="font-medium"
            >
              Sign in
            </CustomText>
            <CustomText as="p" textVariant="label" textSize="sm">
              Enter your phone number to continue.
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
        <div className="flex justify-center">
          <div className="flex flex-col gap-2">
            <CustomText as="label" textVariant="label" textSize="xs">
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
              helperText="Include country code (e.g., +44640020023)"
            />
          </div>
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
