import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { SignUpUseCase } from "../application/SignUpUseCase";
import type { AppUser } from "../domain/authTypes";
import { AppError } from "@/app/shared/domain/AppError";
import CustomText from "@/components/ui/CustomText";
import LineDivider from "@/app/components/LineDivider";
import FloatingInputField from "@/app/components/CustomInputField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/app/components/card/Card";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type FieldNamesMarkedBoolean,
  type UseFormRegister,
  type UseFormWatch,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { useSignInModal } from "../SignInModalContext";
import ComboBox from "@/app/components/ComboBox";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import MobileForm from "@/app/features/dashboard/components/MobileForm";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useLocations } from "@/app/hookes/useLocation";
import { useAuth } from "../../supabase/AuthProvider";
import CustomModal from "@/app/components/CustomModal";
import Spinner from "@/app/components/Spinner";
import { useToast } from "@/app/components/Toast";
import { toDialCode, toIsoCountryCode, toflag } from "@/app/Mapper";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import {
  otpCodeSchema,
} from "@/app/shared/validation/formValidation";
import {
  useRequestPhoneChangeMutation,
  useVerifyPhoneChangeMutation,
} from "@/app/hooks/mutations/useAuthMutations";
import {
  citySchema,
  countrySchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  phoneNumberSchema,
} from "@/app/shared/validation/formValidation";

export const UserDetailsScema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    emailAddress: emailSchema,
    phoneNumber: phoneNumberSchema,
    country: countrySchema,
    city: citySchema,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], //  attaches error to confirmPassword
  });

export type UserDetailsFields = z.infer<typeof UserDetailsScema>;

const changePhoneSchema = z
  .object({
    countryCode: z.string().min(1, "Select a country code"),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Enter your phone number")
      .regex(/^\d+$/, "Enter numbers only, without the country code"),
  })
  .superRefine((value, ctx) => {
    if (toE164PhoneNumber(value.countryCode, value.phoneNumber)) return;

    ctx.addIssue({
      code: "custom",
      path: ["phoneNumber"],
      message: "Enter a valid local phone number",
    });
  });

const verifyPhoneChangeSchema = z.object({
  otpCode: otpCodeSchema,
});

type ChangePhoneFields = z.infer<typeof changePhoneSchema>;
type VerifyPhoneChangeFields = z.infer<typeof verifyPhoneChangeSchema>;

function toE164PhoneNumber(countryCode: string, localPhoneNumber: string) {
  const isoCountryCode = toIsoCountryCode(countryCode);

  if (!isoCountryCode || /^\s*\+/.test(localPhoneNumber)) return null;

  const normalizedLocalNumber = localPhoneNumber.trim();
  const parsed = parsePhoneNumberFromString(
    normalizedLocalNumber,
    isoCountryCode as CountryCode,
  );

  if (parsed?.isValid() || parsed?.isPossible()) return parsed.number;

  if (!normalizedLocalNumber.startsWith("0")) {
    const parsedWithTrunkPrefix = parsePhoneNumberFromString(
      `0${normalizedLocalNumber}`,
      isoCountryCode as CountryCode,
    );

    if (parsedWithTrunkPrefix?.isValid()) return parsedWithTrunkPrefix.number;
  }

  return null;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function CompleteProfile() {
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const signupUseCase = useMemo(() => new SignUpUseCase(authRepo), [authRepo]);
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { openSignInModal } = useSignInModal();
  const isMobile = useMediaQuery();
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      errors,
      isSubmitting,
      dirtyFields,
      touchedFields,
      isValid,
      submitCount,
    },
  } = useForm<UserDetailsFields>({
    resolver: zodResolver(UserDetailsScema),
    defaultValues: {
      firstName: "",
      lastName: "",
      emailAddress: user?.email ?? "",
      phoneNumber: user?.phone ?? "",
      country: "",
      city: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (user?.email) {
      setValue("emailAddress", user.email, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }

    const savedPhoneNumber = profile?.phoneNumber ?? user?.phone;
    const savedCountryCode = profile?.countryCode;

    if (savedPhoneNumber) {
      setValue("phoneNumber", savedPhoneNumber, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }

    if (savedCountryCode) {
      setValue("country", savedCountryCode, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [profile?.countryCode, profile?.phoneNumber, setValue, user?.email, user?.phone]);

  const { showSupabaseError } = useUniversalModal();

  const onSubmit = async (values: UserDetailsFields) => {
    const newUser: AppUser = {
      auth: {
        id: null,
        email: values.emailAddress,
        password: values.password,
      },
      profile: {
        id: null,
        email: values.emailAddress,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        avatarUrl: null,
        countryCode: profile?.countryCode ?? values.country,
        city: values.city,
        phoneNumber: profile?.phoneNumber ?? values.phoneNumber,
      },
    };

    try {
      await signupUseCase.execute(newUser);
      await refreshProfile();
      navigate("/?signup=success", {
        replace: true,
      });
    } catch (err) {
      const appError = AppError.fromUnknown(err);
      if (appError.code === "user_already_exists") {
        showSupabaseError(appError, "Sign in", {
          onLogin: () => openSignInModal(),
        });
      } else {
        showSupabaseError(appError);
      }
    }
  };

  const formContents = (
    <FormContents
      formProps={{
        register: register,
        watch: watch,
        control: control,
        dirtyFields: dirtyFields,
        errors: errors,
        touchedFields: touchedFields,
        isSubmitting: isSubmitting,
        submitCount: submitCount,
        isValid: isValid,
        onChangePhone: () => setChangePhoneOpen(true),
      }}
    />
  );
  return (
    <DefaultContainer center={true} outerClassName="bg-canvas min-h-screen">
      <Card
        paddingClass="sm:px-8 py-5"
        sizeClass="max-w-2xl"
        className="flex flex-col gap-5 overflow-visible"
        enableHover={false}
      >
        {isMobile ? (
          <MobileForm submit={handleSubmit(onSubmit)}>
            {formContents}
          </MobileForm>
        ) : (
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {formContents}
          </motion.form>
        )}
        {changePhoneOpen && user && (
          <ChangePhoneNumberModal
            userId={user.id}
            currentPhoneNumber={profile?.phoneNumber ?? user.phone ?? null}
            currentCountryCode={profile?.countryCode ?? null}
            onClose={() => setChangePhoneOpen(false)}
            onVerified={async () => {
              await refreshProfile();
            }}
          />
        )}
      </Card>
    </DefaultContainer>
  );
}

type FormProps = {
  register: UseFormRegister<UserDetailsFields>;
  watch: UseFormWatch<UserDetailsFields>;
  control: Control<UserDetailsFields>;
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  errors: FieldErrors<UserDetailsFields>;
  touchedFields: Partial<FieldNamesMarkedBoolean<UserDetailsFields>>;
  isSubmitting: boolean;
  submitCount: number;
  isValid: boolean;
  onChangePhone: () => void;
};

type SigupFormProps = {
  formProps: FormProps;
};
function FormContents({ formProps }: SigupFormProps) {
  const {
    register,
    watch,
    dirtyFields,
    isSubmitting,
    submitCount,
    isValid,
    onChangePhone,
    errors,
    touchedFields,
    control,
  } = formProps;

  const firstName = watch("firstName");
  const originCountry = watch("country");
  const lastName = watch("lastName");
  const emailAddress = watch("emailAddress");
  const phoneNumber = watch("phoneNumber");
  const headerContent = "flex flex-col gap-2 mt-2";
  const contentClass = "flex flex-col gap-5";

  const { countryOptions, cityOptions } = useLocations(originCountry);
  return (
    <>
      <span className="flex flex-col items-center gap-1 pb-2">
        <CircleBadge size="lg">
          <SvgIcon size={"lg"} Icon={META_ICONS.addAccount} color="primary" />
        </CircleBadge>
        <CustomText
          as="h1"
          textVariant="primary"
          textSize="lg"
          className="font-medium"
        >
          Complete your profile
        </CustomText>
        <CustomText as="p" textVariant="label" textSize="sm">
          You are almost there. Add a few details so we can help you send and
          carry parcels safely.
        </CustomText>
      </span>
      <LineDivider heightClass="my-0" />
      {/* Personal details */}
      <motion.div variants={item} className={contentClass}>
        <span className={headerContent}>
          <CustomText textVariant="primary" textSize="md">
            Personal details
          </CustomText>
          <span className={contentClass}>
            <div className="flex w-full flex-col sm:flex-row gap-5 sm:gap-7">
              <FloatingInputField
                hasValue={!!firstName}
                label="First name"
                error={errors.firstName?.message}
                isDirty={!!dirtyFields.firstName}
                isTouched={!!touchedFields.firstName}
                {...register("firstName")}
              />
              <FloatingInputField
                hasValue={!!lastName}
                label="Last name"
                error={errors.lastName?.message}
                isDirty={!!dirtyFields.lastName}
                isTouched={!!touchedFields.lastName}
                {...register("lastName")}
              />
            </div>

            <FloatingInputField
              hasValue={!!emailAddress}
              className="max-w-sm"
              label="Email"
              type="email"
              error={errors.emailAddress?.message}
              isDirty={!!dirtyFields.emailAddress}
              isTouched={!!touchedFields.emailAddress}
              {...register("emailAddress")}
            />

            <FloatingInputField
              className="w-full cursor-not-allowed bg-neutral-50 sm:max-w-[260px]"
              hasValue={!!phoneNumber}
              label="Phone number"
              type="tel"
              readOnly
              helperText="Verified phone number"
              error={errors.phoneNumber?.message}
              isDirty={!!dirtyFields.phoneNumber}
              isTouched={!!touchedFields.phoneNumber}
              {...register("phoneNumber")}
            />
            <button
              type="button"
              onClick={onChangePhone}
              className="w-fit text-sm font-medium text-primary-600 hover:underline"
            >
              Change phone number
            </button>
          </span>
        </span>
        <LineDivider heightClass="my-0" />
      </motion.div>
      {/* Location */}
      <motion.div variants={item} className={contentClass}>
        <span className={headerContent}>
          <CustomText textVariant="primary" textSize="md">
            Your location
          </CustomText>
          <Controller
            control={control}
            name="country"
            render={({ field, fieldState }) => (
              <ComboBox
                className="rounded-lg"
                placeholder="Select country"
                menuItems={countryOptions}
                value={field.value}
                disabled
                disabledMessage="Your country is set from your verified phone number"
                onValueChange={field.onChange}
                error={fieldState.error?.message}
                isDirty={fieldState.isDirty}
                isTouched={fieldState.isTouched}
                searchable
              />
            )}
          ></Controller>

          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <ComboBox
                className="rounded-lg mt-3"
                placeholder="Select city"
                menuItems={cityOptions}
                disabled={!originCountry}
                disabledMessage="Select a country first"
                value={field.value}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
                isDirty={fieldState.isDirty}
                isTouched={fieldState.isTouched}
                searchable
              />
            )}
          ></Controller>
        </span>
        <LineDivider heightClass="my-0" />
      </motion.div>

      {/* Submit */}
      <span className="flex flex-col gap-5 mt-5">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full"
          disabled={isSubmitting || (submitCount > 0 && !isValid)}
        >
          <CustomText textVariant="onDark" textSize="sm">
            {isSubmitting ? "Creating account..." : "Join Carry4Me"}
          </CustomText>
        </Button>
      </span>
    </>
  );
}

type ChangePhoneNumberModalProps = {
  userId: string;
  currentPhoneNumber: string | null;
  currentCountryCode: string | null;
  onClose: () => void;
  onVerified: () => Promise<void>;
};

function ChangePhoneNumberModal({
  userId,
  currentPhoneNumber,
  currentCountryCode,
  onClose,
  onVerified,
}: ChangePhoneNumberModalProps) {
  const { countryOptions } = useLocations();
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(
    null,
  );
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const requestPhoneChange = useRequestPhoneChangeMutation();
  const verifyPhoneChange = useVerifyPhoneChangeMutation();
  const { toast } = useToast();
  const { showSupabaseError } = useUniversalModal();

  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    watch: watchPhone,
    setValue: setPhoneValue,
    setError: setPhoneError,
    formState: {
      errors: phoneErrors,
      dirtyFields: phoneDirtyFields,
      touchedFields: phoneTouchedFields,
    },
  } = useForm<ChangePhoneFields>({
    resolver: zodResolver(changePhoneSchema),
    defaultValues: {
      countryCode: currentCountryCode ?? "",
      phoneNumber: "",
    },
    mode: "onTouched",
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    watch: watchOtp,
    reset: resetOtp,
    formState: {
      errors: otpErrors,
      dirtyFields: otpDirtyFields,
      touchedFields: otpTouchedFields,
    },
  } = useForm<VerifyPhoneChangeFields>({
    resolver: zodResolver(verifyPhoneChangeSchema),
    defaultValues: {
      otpCode: "",
    },
    mode: "onTouched",
  });

  const selectedCountryCode = watchPhone("countryCode");
  const newPhoneNumber = watchPhone("phoneNumber");
  const otpCode = watchOtp("otpCode");
  const selectedDialCode = selectedCountryCode
    ? toDialCode(selectedCountryCode)
    : null;
  const selectedFlagIcon = selectedCountryCode
    ? toflag(selectedCountryCode)
    : null;
  const isRequesting = requestPhoneChange.isPending;
  const isVerifying = verifyPhoneChange.isPending;

  useEffect(() => {
    if (selectedCountryCode || !countryOptions[0]) return;

    setPhoneValue("countryCode", countryOptions[0], {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [countryOptions, selectedCountryCode, setPhoneValue]);

  const requestCode = async (values: ChangePhoneFields) => {
    const e164PhoneNumber = toE164PhoneNumber(
      values.countryCode,
      values.phoneNumber,
    );

    if (!e164PhoneNumber) {
      setPhoneError("phoneNumber", {
        message: "Enter a valid local phone number",
      });
      return;
    }

    try {
      await requestPhoneChange.mutateAsync(e164PhoneNumber);
      setPendingPhoneNumber(e164PhoneNumber);
      resetOtp();
      toast("Verification code sent.", { variant: "success" });
    } catch (err) {
      showSupabaseError(err);
    }
  };

  const verifyCode = async (values: VerifyPhoneChangeFields) => {
    if (!pendingPhoneNumber || !selectedCountryCode) return;

    try {
      await verifyPhoneChange.mutateAsync({
        userId,
        phoneNumber: pendingPhoneNumber,
        token: values.otpCode,
        countryCode: selectedCountryCode,
      });
      toast("Phone number updated successfully.", { variant: "success" });
      await onVerified();
      onClose();
    } catch (err) {
      showSupabaseError(err);
    }
  };

  return (
    <CustomModal onClose={onClose} width="md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <CustomText
            textVariant="primary"
            textSize="lg"
            className="font-medium"
          >
            Change phone number
          </CustomText>
          <CustomText textVariant="secondary" textSize="sm">
            Verify your new phone number before it replaces your current one.
          </CustomText>
        </div>

        <LineDivider heightClass="my-0" />

        <form
          onSubmit={handlePhoneSubmit(requestCode)}
          className="flex flex-col gap-3"
        >
          <input type="hidden" {...registerPhone("countryCode")} />
          <div className="grid grid-cols-[minmax(132px,145px)_minmax(0,1fr)] gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <CustomText as="label" textVariant="label" textSize="xs">
                Country code
              </CustomText>
              <div className="relative">
                <button
                  type="button"
                  disabled={isRequesting || isVerifying}
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
                      {selectedCountryCode
                        ? `${selectedCountryCode} ${selectedDialCode ?? ""}`
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
                            setPhoneValue("countryCode", option, {
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
              {phoneErrors.countryCode?.message && (
                <CustomText textVariant="error" textSize="xs">
                  {phoneErrors.countryCode.message}
                </CustomText>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <CustomText as="label" textVariant="label" textSize="xs">
                Phone number
              </CustomText>
              <FloatingInputField
                className="w-full"
                hasValue={!!newPhoneNumber}
                placeholder="Phone number"
                inputMode="numeric"
                pattern="[0-9]*"
                error={phoneErrors.phoneNumber?.message}
                isDirty={!!phoneDirtyFields.phoneNumber}
                isTouched={!!phoneTouchedFields.phoneNumber}
                disabled={isRequesting || isVerifying}
                {...registerPhone("phoneNumber")}
              />
            </div>
          </div>

          {currentPhoneNumber && (
            <CustomText textVariant="secondary" textSize="xs">
              Current phone: {currentPhoneNumber}
            </CustomText>
          )}

          <Button
            type="submit"
            variant="neutral"
            size="sm"
            disabled={isRequesting || isVerifying}
            className="w-fit"
          >
            {isRequesting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                Sending code...
              </span>
            ) : pendingPhoneNumber ? (
              "Resend code"
            ) : (
              "Send verification code"
            )}
          </Button>
        </form>

        {pendingPhoneNumber && (
          <>
            <LineDivider heightClass="my-0" />
            <form
              onSubmit={handleOtpSubmit(verifyCode)}
              className="flex flex-col gap-3"
            >
              <FloatingInputField
                className="w-full sm:max-w-[220px]"
                hasValue={!!otpCode}
                label="Verification code"
                inputMode="numeric"
                maxLength={6}
                error={otpErrors.otpCode?.message}
                isDirty={!!otpDirtyFields.otpCode}
                isTouched={!!otpTouchedFields.otpCode}
                disabled={isVerifying}
                {...registerOtp("otpCode")}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={onClose}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner />
                      Verifying...
                    </span>
                  ) : (
                    "Verify and update"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </CustomModal>
  );
}
