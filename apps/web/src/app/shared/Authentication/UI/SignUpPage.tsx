import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo } from "react";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { SignUpUseCase } from "../application/SignUpUseCase";
import type { AppUser } from "../domain/authTypes";
import { namedCall } from "../application/NamedCall";
import { useToast } from "@/app/components/Toast";
import CustomText from "@/components/ui/CustomText";
import LineDivider from "@/app/components/LineDivider";
import FloatingInputField from "@/app/components/CustomInputField";
import DropDownMenu from "@/app/components/DropDownMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/app/components/card/Card";

import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";

const signupSchema = z
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
    path: ["confirmPassword"], // 👈 attaches error to confirmPassword
  });
let submitCount = 0;
type SignUpFields = z.infer<typeof signupSchema>;

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
  const headerContent = "flex flex-col gap-2 mt-2";
  const contentClass = "flex flex-col gap-5";
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields, touchedFields, isValid },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      emailAddress: "",
      phoneNumber: "",
      country: "",
      city: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const cityValue = watch("city");
  const countryValue = watch("country");

  const { toast } = useToast();

  const onSignUp = async (values: SignUpFields) => {
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
      if (typeof result.error === "string")
        toast(result.error, { variant: "error" });
      return;
    }

    sessionStorage.setItem(
      "redirectToast",
      JSON.stringify({
        message: "Account created you can signIn",
        variant: "success",
      }),
    );

    navigate("/", {
      replace: true,
    });

    toast("Signup success", { variant: "success" });
  };

  return (
    <DefaultContainer>
      <div className="mx-auto w-full max-w-2xl">
        <Card paddingClass="sm:px-8 py-5" className="flex flex-col gap-5">
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
                Signup
              </CustomText>
              <CustomText as="p" textVariant="secondary" textSize="sm">
                Join a community that helps people send parcels home with ease.
              </CustomText>
              <CustomText as="p" className="text-sm text-neutral-400">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-primary-600 font-medium hover:underline"
                >
                  Sign in
                </Link>
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
                  <div className="flex w-full flex-wrap gap-5">
                    <FloatingInputField
                      label="First name"
                      error={errors.firstName?.message}
                      isDirty={!!dirtyFields.firstName}
                      isTouched={!!touchedFields.firstName}
                      {...register("firstName")}
                    />
                    <FloatingInputField
                      label="Last name"
                      error={errors.lastName?.message}
                      isDirty={!!dirtyFields.lastName}
                      isTouched={!!touchedFields.lastName}
                      {...register("lastName")}
                    />
                  </div>

                  <FloatingInputField
                    className="w-full sm:max-w-[350px]"
                    label="Email"
                    type="email"
                    error={errors.emailAddress?.message}
                    isDirty={!!dirtyFields.emailAddress}
                    isTouched={!!touchedFields.emailAddress}
                    {...register("emailAddress")}
                  />

                  <span className="flex">
                    <FloatingInputField
                      label="Phone number"
                      type="tel"
                      error={errors.phoneNumber?.message}
                      isDirty={!!dirtyFields.phoneNumber}
                      isTouched={!!touchedFields.phoneNumber}
                      {...register("phoneNumber")}
                    />
                  </span>
                </span>
              </span>
              <LineDivider heightClass="my-0" />
            </motion.div>

            {/* Security */}
            <motion.div variants={item} className={contentClass}>
              <span className={headerContent}>
                <CustomText textVariant="primary" textSize="md">
                  Security
                </CustomText>
                <span className={contentClass}>
                  <span className="flex">
                    <FloatingInputField
                      label="Password"
                      type="password"
                      error={errors.password?.message}
                      isDirty={!!dirtyFields.password}
                      isTouched={!!touchedFields.password}
                      {...register("password")}
                    />
                  </span>
                  <span className="flex">
                    <FloatingInputField
                      label="Confirm password"
                      type="password"
                      error={errors.confirmPassword?.message}
                      isDirty={!!dirtyFields.confirmPassword}
                      isTouched={!!touchedFields.confirmPassword}
                      {...register("confirmPassword")}
                    />
                  </span>
                </span>
              </span>
              <LineDivider heightClass="my-0" />
            </motion.div>

            {/* Location */}
            <motion.div variants={item} className={contentClass}>
              <span className={headerContent}>
                <CustomText textVariant="primary" textSize="md">
                  Location
                </CustomText>

                {/* If your DropDownMenu supports register, keep this.
                  If it *doesn't* (custom onChange), use Controller instead. */}
                <span className="flex gap-7">
                  <DropDownMenu
                    className="rounded-md"
                    placeholder="Selected country"
                    menuItems={["UK"]}
                    value={countryValue}
                    error={errors.country?.message}
                    isDirty={!!dirtyFields.country}
                    isTouched={!!touchedFields.country}
                    register={register("country")}
                  />

                  <DropDownMenu
                    className="rounded-md w-full sm:max-w-[200px]"
                    placeholder="Selected city"
                    menuItems={["London"]}
                    value={cityValue}
                    error={errors.city?.message}
                    isDirty={!!dirtyFields.city}
                    isTouched={!!touchedFields.city}
                    register={register("city")}
                  />
                </span>
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
                <CustomText textVariant="onDark" textSize="lg">
                  {isSubmitting ? "processing..." : "Join Carry4me"}
                </CustomText>
              </Button>
            </span>
          </motion.form>
        </Card>
      </div>
    </DefaultContainer>
  );
}
