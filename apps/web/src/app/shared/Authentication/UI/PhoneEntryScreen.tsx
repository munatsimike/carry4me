import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
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
import { toFriendlyErrorMessage } from "../application/normalizeSupabaseError";
import { META_ICONS } from "@/app/icons/MetaIcon";
import SvgIcon from "@/components/ui/SvgIcon";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { useLocations } from "@/app/hookes/useLocation";
import { toDialCode, toIsoCountryCode, toflag } from "@/app/Mapper";

function toE164PhoneNumber(countryCode: string, localPhoneNumber: string) {
  const isoCountryCode = toIsoCountryCode(countryCode);

  if (!isoCountryCode || /^\s*\+/.test(localPhoneNumber)) return null;

  const parsed = parsePhoneNumberFromString(
    localPhoneNumber.trim(),
    isoCountryCode as CountryCode,
  );

  return parsed?.isValid() ? parsed.number : null;
}

const phoneSchema = z
  .object({
    countryCode: z.string().min(1, "Select a country code"),
    phoneNumber: z.string().trim().min(1, "Enter your phone number"),
  })
  .superRefine((value, ctx) => {
    if (toE164PhoneNumber(value.countryCode, value.phoneNumber)) return;

    ctx.addIssue({
      code: "custom",
      path: ["phoneNumber"],
      message: "Enter a valid phone number",
    });
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
  const { countryOptions } = useLocations();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError: setFieldError,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: "",
      phoneNumber: "",
    },
    mode: "onTouched",
  });

  const selectedCountry = watch("countryCode");
  const phoneNumber = watch("phoneNumber");
  const selectedDialCode = selectedCountry ? toDialCode(selectedCountry) : null;
  const selectedFlagIcon = selectedCountry ? toflag(selectedCountry) : null;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (selectedCountry || !countryOptions[0]) return;

    setValue("countryCode", countryOptions[0], {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [countryOptions, selectedCountry, setValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!countryMenuRef.current?.contains(event.target as Node)) {
        setCountryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendOTP = async (values: PhoneFormValues) => {
    const e164PhoneNumber = toE164PhoneNumber(
      values.countryCode,
      values.phoneNumber,
    );
    if (!e164PhoneNumber) {
      setFieldError("phoneNumber", {
        message: "Enter a valid phone number",
      });
      return;
    }

    setLoading(true);
    try {
      await sendOTPUseCase.execute(e164PhoneNumber);
      setPhoneNumber(e164PhoneNumber);
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
        className="w-full flex flex-col gap-4"
      >
        <div className="flex justify-center">
          <div className="flex w-[min(100%,360px)] flex-col gap-1">
            <div className="grid grid-cols-[minmax(132px,140px)_minmax(0,1fr)] gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                <CustomText as="label" textVariant="label" textSize="xs">
                  Country code
                </CustomText>
                <input type="hidden" {...register("countryCode")} />
                <div ref={countryMenuRef} className="relative">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    aria-expanded={countryMenuOpen}
                    aria-label="Select country code"
                    onClick={() => setCountryMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-300 bg-white py-2 pl-3 pr-3 text-left text-sm text-ink-primary outline-none transition-colors focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {selectedFlagIcon && (
                        <SvgIcon size="xs" Icon={selectedFlagIcon} />
                      )}
                      <span className="truncate">
                        {selectedCountry
                          ? `${selectedCountry} ${selectedDialCode ?? ""}`
                          : "Select"}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                  </button>

                  {countryMenuOpen && (
                    <div className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {countryOptions.map((option) => {
                        const flagIcon = toflag(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setValue("countryCode", option, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                              setCountryMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {flagIcon && <SvgIcon size="xs" Icon={flagIcon} />}
                            <span className="truncate">
                              {option} {toDialCode(option) ?? ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {errors.countryCode?.message && (
                  <CustomText textVariant="error" textSize="xs">
                    {errors.countryCode.message}
                  </CustomText>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <CustomText as="label" textVariant="label" textSize="xs">
                  Phone number
                </CustomText>
                <FloatingInputField
                  hasValue={!!phoneNumber}
                  placeholder="Phone number"
                  {...register("phoneNumber")}
                  disabled={isSubmitting}
                  error={errors.phoneNumber?.message}
                  isDirty={dirtyFields.phoneNumber ?? false}
                  isTouched={!!touchedFields.phoneNumber}
                />
              </div>
            </div>
            <CustomText textVariant="helperText" textSize="xs">
              Use a phone number that can receive SMS messages.
            </CustomText>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative mb-1"
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
