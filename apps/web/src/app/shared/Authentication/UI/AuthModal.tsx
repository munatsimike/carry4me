import { Link, useNavigate } from "react-router-dom";
import { useAuthModal } from "../AuthModalContext";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "../../../icons/MetaIcon";
import CustomText from "@/components/ui/CustomText";
import FloatingInputField from "../../../components/CustomInputField";
import { Button } from "@/components/ui/Button";
import { InlineRow } from "../../../components/InlineRow";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { signInWithProvider } from "../../supabase/authOAuthService";
import Spinner from "../../../components/Spinner";
import ErrorText from "../../../components/text/ErrorText";
import { LoginUseCase } from "../application/LoginUseCase";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import FormModal from "@/app/features/dashboard/components/FormModal";
import { AnimatePresence } from "framer-motion";
import z from "zod";
import { namedCall } from "../application/NamedCall";
import { useUniversalModal } from "../application/DialogBoxModalProvider";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .toLowerCase()
    .pipe(z.email({ message: "Enter a valid email" })),
  password: z.string().min(4, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export function AuthModal() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const emailAddress = watch("email");
  const password = watch("password");
  const [loginError, setError] = useState<string | null>(null);
  const { state, closeAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const useCase = useMemo(() => new LoginUseCase(repo), [repo]);
  const { showSupabaseError } = useUniversalModal();

  useEffect(() => {
    if (!state.isOpen) {
      reset();
      setError(null);
    }
  }, [state.isOpen, reset]);

  useEffect(() => {
    setError(null);
  }, [emailAddress, password]);

  const handleSignIn = async (value: FormValues) => {
    const { email, password } = value;
    const { result } = await namedCall(
      "login",
      useCase.execute(email, password),
    );

    if (!result.success) {
      showSupabaseError(result.error);
      return;
    }
    if (result.success) {
      setError(null);
      closeAuthModal();
      if (state.redirectTo) {
        navigate("/dashboard");
      }
    }
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <FormModal
          onSubmit={handleSubmit(handleSignIn)}
          onClose={closeAuthModal}
        >
          <div className="flex flex-col w-full max-w-[500px] mx-auto items-center gap-5 px-4 sm:px-0">
            <div className="flex items-center justify-center">
              <ErrorText error={loginError?.toString()}>
                <span className="inline-flex flex-col gap-2 items-center">
                  <SvgIcon
                    size={"xxl"}
                    Icon={META_ICONS.loginIcon}
                    color="primary"
                  />

                  <CustomText
                    as="span"
                    textVariant="primary"
                    textSize="xl"
                    className="whitespace-nowrap leading-tight"
                  >
                    {"Sign in to your account."}
                  </CustomText>
                </span>
              </ErrorText>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-5">
              <FloatingInputField
              className="max-w-sm"
                hasValue={!!emailAddress}
                isDirty={!!dirtyFields.email}
                isTouched={!!touchedFields.email}
                type="text"
                leadingIcon={
                  <SvgIcon size={"sm"} Icon={META_ICONS.emailIcon} />
                }
                {...register("email")}
                label={"Enter email"}
                error={errors.email?.message}
              />

              <FloatingInputField
               className="max-w-sm"
                hasValue={!!password}
                isDirty={!!dirtyFields.password}
                isTouched={!!touchedFields.password}
                type="password"
                onIconClick={setShowPassword}
                leadingIcon={<SvgIcon size={"sm"} Icon={META_ICONS.lockIcon} />}
                {...register("password")}
                label={"Enter password"}
                error={errors.password?.message}
              />
            </div>

            <span className="flex flex-col gap-2 w-full max-w-xs">
              <span className="relative inline-flex flex-col gap-3 items-center">
                <LoginButton isFormSubmitting={isSubmitting} />
                <Link to="/update-password" onClick={closeAuthModal}>
                  <CustomText
                    as="p"
                    textVariant="linkText"
                    className="whitespace-nowrap"
                  >
                    {"Forgot password"}
                  </CustomText>
                </Link>
              </span>

              <span className="inline-flex flex-col gap-1 items-center">
                <span className="flex gap-1 items-center">
                  <CustomText
                    as="p"
                    textVariant="primary"
                    textSize="sm"
                    className="whitespace-nowrap"
                  >
                    {"Don’t have an account?"}
                  </CustomText>
                  <Link to="/signup">
                    <button onClick={closeAuthModal} type="button">
                      <CustomText
                        as="span"
                        textVariant="linkText"
                        className="whitespace-nowrap"
                      >
                        {"Sign up"}
                      </CustomText>
                    </button>
                  </Link>
                </span>
                <CustomText as="p" textSize="xs">
                  {"or"}
                </CustomText>
                <CustomText as="p" textSize="xs" className="whitespace-nowrap">
                  {"Continue with"}
                </CustomText>
              </span>
              <OtherWaysToSignIn />
            </span>
          </div>
        </FormModal>
      )}
    </AnimatePresence>
  );
}

function OtherWaysToSignIn() {
  const iconTextGap = "2";
  const iconSize = "sm";
  const lableSize = "xs";
  const { state } = useAuthModal();

  const redirectTo = state.redirectTo ?? window.location.origin;

  const onGoogle = async () => {
    const { error } = await signInWithProvider("google", redirectTo);
    if (error) console.error(error.message);
  };

  const onFacebook = async () => {
    const { error } = await signInWithProvider("facebook", redirectTo);
    if (error) console.error(error.message);
  };

  const onTwitter = async () => {
    const { error } = await signInWithProvider("twitter", redirectTo);
    if (error) console.error(error.message);
  };
  return (
    <div className="flex w-full max-w-sm items-center justify-center gap-4 sm:gap-6 pt-1">
      <InlineRow gap={iconTextGap} onClick={onFacebook}>
        <SvgIcon size={iconSize} Icon={META_ICONS.facebookIcon} />
        <CustomText textSize={lableSize} textVariant="primary">
          {"Facebook"}
        </CustomText>
      </InlineRow>
      <InlineRow gap={iconTextGap} onClick={onGoogle}>
        <SvgIcon size={iconSize} Icon={META_ICONS.googleIcon} />
        <CustomText textSize={lableSize} textVariant="primary">
          {"Google"}
        </CustomText>
      </InlineRow>
      <InlineRow gap={iconTextGap} onClick={onTwitter}>
        <SvgIcon size={iconSize} Icon={META_ICONS.twitterIcon} />
        <CustomText textSize={lableSize} textVariant="primary">
          {"Twitter"}
        </CustomText>
      </InlineRow>
    </div>
  );
}

function LoginButton({ isFormSubmitting }: { isFormSubmitting: boolean }) {
  return (
    <Button
      className="w-full"
      disabled={isFormSubmitting}
      type="submit"
      aria-busy={isFormSubmitting}
      variant={"primary"}
      size={"md"}
      isBusy={isFormSubmitting}
    >
      <span className="inline-flex items-center gap-2  justify-center">
        {isFormSubmitting && <Spinner />}
        {
          <CustomText textVariant="primary" className="text-white px-1">
            {isFormSubmitting ? "Processing..." : "Sign in"}
          </CustomText>
        }
      </span>
    </Button>
  );
}
