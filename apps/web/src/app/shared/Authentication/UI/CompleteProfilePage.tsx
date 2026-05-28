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
import { UserRound } from "lucide-react";
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
import SvgIcon from "@/components/ui/SvgIcon";
import { useSignInModal } from "../SignInModalContext";
import ComboBox from "@/app/components/ComboBox";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import MobileForm from "@/app/features/dashboard/components/MobileForm";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useLocations } from "@/app/hookes/useLocation";
import { useAuth } from "../../supabase/AuthProvider";
import { sendEmailVerification } from "@/app/shared/supabase/sendEmailVerification";
import { useEmailVerification } from "./EmailVerificationContext";
import CustomModal from "@/app/components/CustomModal";
import Spinner from "@/app/components/Spinner";
import { useToast } from "@/app/components/Toast";
import {
  countryCodeFromPhone,
  normalizeCountryCode,
  toDialCode,
  toflag,
} from "@/app/Mapper";
import { otpCodeSchema } from "@/app/shared/validation/formValidation";
import { toE164PhoneNumber } from "../application/toE164PhoneNumber";
import PhoneNumberWithCountryFields from "./components/PhoneNumberWithCountryFields";
import {
  phoneWithCountrySchema,
  type PhoneWithCountryFields,
} from "../validation/phoneWithCountrySchema";
import {
  useRequestPhoneChangeMutation,
  useVerifyPhoneChangeMutation,
} from "@/app/hooks/mutations/useAuthMutations";
import AgreeToTermsAndSafetyRow from "@/app/features/dashboard/components/AgreeToTermsAndSafetyRow";
import {
  agreeToTermsAndSafetySchema,
  citySchema,
  countrySchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
} from "@/app/shared/validation/formValidation";
import EmailVerificationBadge from "./EmailVerificationBadge";

export const profileDetailsSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  emailAddress: emailSchema,
  phoneNumber: z.string().optional(),
  country: countrySchema,
  city: citySchema,
});

export type ProfileDetailsFields = z.infer<typeof profileDetailsSchema>;

/** Complete-profile route only — includes terms acceptance. */
export const completeProfileFormSchema = profileDetailsSchema.extend({
  agreeToTermsAndSafety: agreeToTermsAndSafetySchema,
});

export type CompleteProfileFields = z.infer<typeof completeProfileFormSchema>;

/** @deprecated Use profileDetailsSchema for profile settings */
export const completeProfileSchema = profileDetailsSchema;

/** @deprecated Use profileDetailsSchema */
export const UserDetailsScema = profileDetailsSchema;

/** @deprecated Use ProfileDetailsFields */
export type UserDetailsFields = ProfileDetailsFields;

const verifyPhoneChangeSchema = z.object({
  otpCode: otpCodeSchema,
});

type VerifyPhoneChangeFields = z.infer<typeof verifyPhoneChangeSchema>;

function formatVerifiedPhoneNumber(
  phoneNumber: string | null | undefined,
  countryCode: string | null | undefined,
) {
  if (!phoneNumber) return "";
  if (phoneNumber.trim().startsWith("+")) return phoneNumber;

  const digits = phoneNumber.replace(/\D/g, "");
  const dialCode = countryCode ? toDialCode(countryCode) : null;

  if (!digits || !dialCode) return phoneNumber;

  const dialDigits = dialCode.replace(/\D/g, "");
  if (digits.startsWith(dialDigits)) return `+${digits}`;

  return `${dialCode}${digits.replace(/^0+/, "")}`;
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
  const { openSignInModal } = useSignInModal();
  const { openCheckEmailModal } = useEmailVerification();
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
    },
  } = useForm<CompleteProfileFields>({
    resolver: zodResolver(completeProfileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      emailAddress: user?.email ?? "",
      phoneNumber: user?.phone ?? "",
      country: "",
      city: "",
      agreeToTermsAndSafety: false,
    },
    mode: "onTouched",
  });

  const formPhoneNumber = watch("phoneNumber");
  const selectedCountry = watch("country");
  const phoneCountryCode = countryCodeFromPhone(formPhoneNumber);

  const countryCodeForCities = useMemo(() => {
    return (
      phoneCountryCode ??
      normalizeCountryCode(selectedCountry) ??
      profile?.countryCode ??
      normalizeCountryCode(profile?.country) ??
      undefined
    );
  }, [
    phoneCountryCode,
    profile?.country,
    profile?.countryCode,
    selectedCountry,
  ]);

  const {
    cityOptions,
    getCountryName,
    getCountryCode,
    isLoading: locationsLoading,
  } = useLocations(countryCodeForCities);

  useEffect(() => {
    if (user?.email) {
      setValue("emailAddress", user.email, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }

    const savedPhoneNumber = profile?.phoneNumber ?? user?.phone;

    if (savedPhoneNumber) {
      setValue("phoneNumber", savedPhoneNumber, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [profile?.phoneNumber, setValue, user?.email, user?.phone]);

  useEffect(() => {
    if (!countryCodeForCities) return;

    const countryToSet = getCountryName(countryCodeForCities);
    if (countryToSet === "—") return;

    setValue("country", countryToSet, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [countryCodeForCities, getCountryName, setValue]);

  useEffect(() => {
    if (!profile?.city) return;

    setValue("city", profile.city, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [profile?.city, setValue]);

  const { showSupabaseError } = useUniversalModal();

  const onSubmit = async (values: CompleteProfileFields) => {
    const newUser: AppUser = {
      auth: {
        id: null,
        email: values.emailAddress,
        password: "",
      },
      profile: {
        id: null,
        email: values.emailAddress,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        avatarUrl: null,
        country: getCountryName(values.country),
        countryCode:
          countryCodeFromPhone(values.phoneNumber) ??
          getCountryCode(values.country),
        city: values.city,
        phoneNumber: profile?.phoneNumber ?? values.phoneNumber ?? null,
      },
    };

    try {
      await signupUseCase.execute(newUser);
      await refreshProfile();

      const shouldSendVerification =
        values.emailAddress.trim().length > 0 &&
        profile?.emailVerified !== true;

      if (shouldSendVerification) {
        try {
          await sendEmailVerification();
          openCheckEmailModal();
        } catch (verificationError) {
          console.error(
            "Failed to send verification email:",
            verificationError,
          );
        }
      }
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
        onChangePhone: () => setChangePhoneOpen(true),
      }}
      locationProps={{
        cityOptions,
        countryCodeForCities,
        getCountryName,
        getCountryCode,
        locationsLoading,
        phoneCountryCode,
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
            currentCountryCode={
              countryCodeFromPhone(profile?.phoneNumber ?? user.phone) ?? null
            }
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
  register: UseFormRegister<CompleteProfileFields>;
  watch: UseFormWatch<CompleteProfileFields>;
  control: Control<CompleteProfileFields>;
  dirtyFields: FieldNamesMarkedBoolean<CompleteProfileFields>;
  errors: FieldErrors<CompleteProfileFields>;
  touchedFields: Partial<FieldNamesMarkedBoolean<CompleteProfileFields>>;
  isSubmitting: boolean;
  onChangePhone: () => void;
};

type LocationProps = {
  cityOptions: string[];
  countryCodeForCities?: string;
  getCountryName: (countryValue: string | null | undefined) => string;
  getCountryCode: (countryValue: string | null | undefined) => string | null;
  locationsLoading: boolean;
  phoneCountryCode: string | null;
};

type SigupFormProps = {
  formProps: FormProps;
  locationProps: LocationProps;
};
function FormContents({ formProps, locationProps }: SigupFormProps) {
  const {
    register,
    watch,
    dirtyFields,
    isSubmitting,
    onChangePhone,
    errors,
    touchedFields,
    control,
  } = formProps;
  const { profile } = useAuth();
  const emailVerified = profile?.emailVerified === true;

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const emailAddress = watch("emailAddress");
  const phoneNumber = watch("phoneNumber");
  const { cityOptions, countryCodeForCities, getCountryName, phoneCountryCode } =
    locationProps;
  const formattedPhoneNumber = formatVerifiedPhoneNumber(
    phoneNumber,
    phoneCountryCode,
  );
  const displayCountry = countryCodeForCities
    ? getCountryName(countryCodeForCities)
    : "";
  const countryFlagIcon = countryCodeForCities
    ? toflag(countryCodeForCities)
    : null;
  const headerContent = "flex flex-col gap-2 mt-2";
  const contentClass = "flex flex-col gap-5";
  return (
    <>
      <span className="flex flex-col items-center gap-1 pb-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <UserRound size={32} aria-hidden strokeWidth={1.75} />
        </span>
        <CustomText
          as="h1"
          textVariant="primary"
          textSize="lg"
          className="font-medium"
        >
          Complete your profile
        </CustomText>
        <CustomText as="p" textVariant="label" textSize="sm">
          Complete your details to send or carry parcels.
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
              trailingIcon={
                emailAddress?.trim() ? (
                  <EmailVerificationBadge verified={emailVerified} />
                ) : undefined
              }
              {...register("emailAddress")}
            />

            <FloatingInputField
              className="w-full cursor-not-allowed bg-neutral-50 sm:max-w-[260px]"
              hasValue={!!phoneNumber}
              label=""
              type="text"
              readOnly
              disabled
              value={formattedPhoneNumber}
              trailingIcon={
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Verified
                </span>
              }
              isDirty={false}
              isTouched={false}
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
          <FloatingInputField
            className="w-full cursor-not-allowed bg-neutral-50 sm:max-w-[260px]"
            hasValue={!!displayCountry}
            label=""
            readOnly
            disabled
            value={displayCountry}
            leadingIcon={
              countryFlagIcon ? (
                <SvgIcon size="sm" Icon={countryFlagIcon} />
              ) : undefined
            }
            isDirty={false}
            isTouched={false}
          />

          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <ComboBox
                wrapperClassName="w-full sm:max-w-[260px]"
                placeholder="Select city"
                menuItems={cityOptions}
                disabled={!countryCodeForCities}
                disabledMessage="Select a country first"
                value={field.value}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
                isDirty={fieldState.isDirty}
                isTouched={fieldState.isTouched}
                heightClass="h-10 py-0"
                searchable
              />
            )}
          ></Controller>
        </span>
        <LineDivider heightClass="my-0" />
      </motion.div>

      {/* Terms */}
      <motion.div variants={item}>
        <AgreeToTermsAndSafetyRow
          register={register("agreeToTermsAndSafety")}
          id="complete-profile-terms-safety"
          error={errors.agreeToTermsAndSafety?.message}
        />
      </motion.div>

      {/* Submit */}
      <span className="flex flex-col gap-5 mt-5">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full"
          disabled={isSubmitting}
        >
          <CustomText textVariant="onDark" textSize="sm">
            {isSubmitting ? "Saving profile..." : "Save profile"}
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
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(
    null,
  );
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
  } = useForm<PhoneWithCountryFields>({
    resolver: zodResolver(phoneWithCountrySchema),
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
  const otpCode = watchOtp("otpCode");
  const isRequesting = requestPhoneChange.isPending;
  const isVerifying = verifyPhoneChange.isPending;

  const requestCode = async (values: PhoneWithCountryFields) => {
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
    <CustomModal onClose={onClose} width="xl" scrollable={false}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <CustomText
            textVariant="primary"
            textSize="lg"
            className="font-medium"
          >
            Change phone number
          </CustomText>
          <CustomText textVariant="secondary" textSize="sm">
            Enter your new phone number.
          </CustomText>
        </div>

        <LineDivider heightClass="my-0" />

        <form
          onSubmit={handlePhoneSubmit(requestCode)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3">
            <div className="mx-auto w-full max-w-[360px]">
              <PhoneNumberWithCountryFields
                register={registerPhone}
                setValue={setPhoneValue}
                watch={watchPhone}
                errors={phoneErrors}
                dirtyFields={phoneDirtyFields}
                touchedFields={phoneTouchedFields}
                disabled={isRequesting || isVerifying}
                defaultCountryCode={currentCountryCode}
                phoneHelperText={
                  pendingPhoneNumber
                    ? `Code sent to ${pendingPhoneNumber}`
                    : undefined
                }
              />
            </div>

            {currentPhoneNumber && (
              <CustomText as="p" textVariant="secondary" textSize="xs">
                Current phone:{" "}
                <CustomText as="span" textVariant="primary" textSize="xs">
                  {currentPhoneNumber}
                </CustomText>
              </CustomText>
            )}
          </div>

          <LineDivider heightClass="my-0" />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isRequesting || isVerifying}
            className="w-full justify-center"
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
                className="mx-auto w-full max-w-[360px]"
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
