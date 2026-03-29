import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo } from "react";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { SignUpUseCase } from "../application/SignUpUseCase";
import type { AppUser } from "../domain/authTypes";
import { namedCall } from "../application/NamedCall";
import CustomText from "@/components/ui/CustomText";
import LineDivider from "@/app/components/LineDivider";
import FloatingInputField from "@/app/components/CustomInputField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/app/components/card/Card";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { useAuthModal } from "../AuthModalContext";
import ComboBox from "@/app/components/ComboBox";
import { useUniversalModal } from "../application/DialogBoxModalProvider";

export const UserDetailsScema = z
  .object({
    firstName: z.string().trim().min(2, "First name is required"),
    lastName: z.string().trim().min(2, "Last name is required"),
    emailAddress: z.string().trim().email("Enter a valid email"),
    phoneNumber: z.string().trim().min(7, "Enter a valid phone number"),
    country: z.string().trim().min(1, "Country is required"),
    city: z.string().trim().min(2, "City is required"),
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

export default function SignUpPage() {
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const signupUseCase = useMemo(() => new SignUpUseCase(authRepo), [authRepo]);
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();
  const headerContent = "flex flex-col gap-2 mt-2";
  const contentClass = "flex flex-col gap-5";

  const {
    control,
    register,
    handleSubmit,
    watch,
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
      emailAddress: "",
      phoneNumber: "",
      country: "",
      city: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const emailAddress = watch("emailAddress");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const phoneNumber = watch("phoneNumber");
  const { showSupabaseError } = useUniversalModal();

  const onSignUp = async (values: UserDetailsFields) => {
    const newUser: AppUser = {
      auth: {
        id: null,
        email: values.emailAddress,
        password: values.password,
      },
      profile: {
        id: null,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        avatarUrl: null,
        countryCode: values.country,
        city: values.city,
        phoneNumber: values.phoneNumber,
      },
    };

    const { result } = await namedCall(
      "signup",
      signupUseCase.execute(newUser),
    );

    if (!result.success) {
      if (result.error.code === "user_already_exists") {
        showSupabaseError(result.error, "Signin", {
          onLogin: () =>
            openAuthModal({
              mode: "signin",
            }),
        });
      } else {
        showSupabaseError(result.error);
      }

      return;
    }

    navigate("/?signup=success", {
      replace: true,
    });
  };

  return (
    <DefaultContainer center={true} outerClassName="bg-canvas min-h-screen">
      <Card
        paddingClass="sm:px-8 py-5 px-5"
        sizeClass="max-w-2xl"
        className="flex flex-col gap-5"
        enableHover={false}
      >
        <motion.form
          onSubmit={handleSubmit(onSignUp)}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <span className="flex flex-col items-center gap-1 pb-4">
            <CircleBadge size="lg">
              <SvgIcon
                size={"lg"}
                Icon={META_ICONS.addAccount}
                color="primary"
              />
            </CircleBadge>
            <CustomText as="h1" textVariant="primary" textSize="xl">
              Join Carry4me
            </CustomText>
            <CustomText as="p" textVariant="label" textSize="sm">
              Join a community that helps people send parcels home with ease.
            </CustomText>
            <span className="inline-flex items-center gap-1">
              <CustomText as="p" className="text-sm text-neutral-400">
                Already have an account?
              </CustomText>

              <button
                type="button"
                onClick={() => {
                  openAuthModal({
                    mode: "signin",
                    redirectTo: "/signup",
                  });
                }}
              >
                <CustomText as="span" textVariant="linkText">
                  Sign in
                </CustomText>
              </button>
            </span>
          </span>
          <LineDivider heightClass="my-0" />
          {/* Personal details */}
          <motion.div variants={item} className={contentClass}>
            <span className={headerContent}>
              <CustomText textVariant="primary" textSize="lg">
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
                  className="max-w-[230px]"
                  hasValue={!!phoneNumber}
                  label="Phone number"
                  type="tel"
                  error={errors.phoneNumber?.message}
                  isDirty={!!dirtyFields.phoneNumber}
                  isTouched={!!touchedFields.phoneNumber}
                  {...register("phoneNumber")}
                />
              </span>
            </span>
            <LineDivider heightClass="my-0" />
          </motion.div>

          {/* Security */}
          <motion.div variants={item} className={contentClass}>
            <span className={headerContent}>
              <CustomText textVariant="primary" textSize="lg">
                Security
              </CustomText>

              <FloatingInputField
                hasValue={!!password}
                label="Password"
                type="password"
                error={errors.password?.message}
                isDirty={!!dirtyFields.password}
                isTouched={!!touchedFields.password}
                {...register("password")}
              />

              <FloatingInputField
                className="my-3"
                hasValue={!!confirmPassword}
                label="Confirm password"
                type="password"
                error={errors.confirmPassword?.message}
                isDirty={!!dirtyFields.confirmPassword}
                isTouched={!!touchedFields.confirmPassword}
                {...register("confirmPassword")}
              />

              <LineDivider heightClass="m-0" />
            </span>
          </motion.div>

          {/* Location */}
          <motion.div variants={item} className={contentClass}>
            <span className={headerContent}>
              <CustomText textVariant="primary" textSize="lg">
                Your location
              </CustomText>

              <Controller
                control={control}
                name="country"
                render={({ field, fieldState }) => (
                  <ComboBox
                    className="rounded-lg"
                    placeholder="Selected country"
                    menuItems={["UK"]}
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
                    placeholder="Selected city"
                    menuItems={["London"]}
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
              size="md"
              className="w-full"
              disabled={isSubmitting || (submitCount > 0 && !isValid)}
            >
              <CustomText textVariant="onDark" textSize="md">
                {isSubmitting ? "processing..." : "Join Carry4me"}
              </CustomText>
            </Button>
          </span>
        </motion.form>
      </Card>
    </DefaultContainer>
  );
}
