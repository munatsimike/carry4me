import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo } from "react";
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
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const signupUseCase = useMemo(() => new SignUpUseCase(authRepo), [authRepo]);
  const { user, refreshProfile } = useAuth();
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

    if (user?.phone) {
      setValue("phoneNumber", user.phone, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [setValue, user?.email, user?.phone]);

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
        countryCode: values.country,
        city: values.city,
        phoneNumber: values.phoneNumber,
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
