import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { CircleBadge } from "@/components/ui/CircleBadge";
import LineDivider from "@/app/components/LineDivider";
import ErrorText from "@/app/components/text/ErrorText";
import Spinner from "@/app/components/Spinner";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { SendPhoneOTPUseCase } from "../application/SendPhoneOTPUseCase";
import { toE164PhoneNumber } from "../application/toE164PhoneNumber";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import { toFriendlyErrorMessage } from "../application/normalizeSupabaseError";
import PhoneNumberWithCountryFields from "./components/PhoneNumberWithCountryFields";
import {
  phoneWithCountrySchema,
  type PhoneWithCountryFields,
} from "../validation/phoneWithCountrySchema";

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
    setValue,
    setError: setFieldError,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<PhoneWithCountryFields>({
    resolver: zodResolver(phoneWithCountrySchema),
    defaultValues: {
      countryCode: "",
      phoneNumber: "",
    },
    mode: "onTouched",
  });

  const phoneNumber = watch("phoneNumber");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    setPhoneNumber,
    setSelectedCountryCode,
    setStep,
    setLoading,
    setError,
  } = usePhoneVerification();
  const { showSupabaseError } = useUniversalModal();

  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const sendOTPUseCase = useMemo(
    () => new SendPhoneOTPUseCase(authRepo),
    [authRepo],
  );

  useEffect(() => {
    setSubmitError(null);
  }, [phoneNumber]);

  const handleSendOTP = async (values: PhoneWithCountryFields) => {
    const e164PhoneNumber = toE164PhoneNumber(
      values.countryCode,
      values.phoneNumber,
    );
    if (!e164PhoneNumber) {
      setFieldError("phoneNumber", {
        message: "Enter a valid local phone number",
      });
      return;
    }

    setLoading(true);
    try {
      await sendOTPUseCase.execute(e164PhoneNumber);
      setPhoneNumber(e164PhoneNumber);
      setSelectedCountryCode(values.countryCode);
      setStep("otp-verification");
      onPhoneSubmitted();
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
      showSupabaseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto items-center gap-4 px-4 sm:px-0">
      <motion.div variants={item} className="flex items-center justify-center">
        <ErrorText error={submitError?.toString()}>
          <span className="inline-flex flex-col items-center gap-2">
            <CircleBadge size="lg" bgColor="secondary" paddingClassName="p-2.5">
              <UserRound
                className=" text-primary-500"
                size={32}
                aria-hidden
              />
            </CircleBadge>

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
        className="w-full flex flex-col gap-4"
      >
        <div className="flex justify-center">
          <div className="w-[min(100%,360px)]">
            <PhoneNumberWithCountryFields
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
              dirtyFields={dirtyFields}
              touchedFields={touchedFields}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative mb-1 mt-2"
          variant={"primary"}
          size={"sm"}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              <span className="ml-2">Sending code...</span>
            </>
          ) : (
            "Send verification code"
          )}
        </Button>
        <CustomText
          textVariant="helperText"
          textSize="xs"
          className="-mt-3 text-center"
        >
          Carry4Me is currently available in supported countries.
        </CustomText>
      </motion.form>
    </div>
  );
}
