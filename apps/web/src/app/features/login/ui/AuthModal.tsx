import { useNavigate } from "react-router-dom";
import { useAuthModal } from "../../../shared/Authentication/AuthModalContext";
import CustomModal from "../../../components/CustomModal";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "../../../icons/MetaIcon";
import CustomText from "@/components/ui/CustomText";
import FloatingInputField from "../../../components/CustomInputField";
import { Button } from "@/components/ui/Button";
import { InlineRow } from "../../../components/InlineRow";
import z, { email } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { signInWithProvider } from "../../../shared/supabase/authOAuthService";
import Spinner from "../../../components/Spinner";
import LinkText from "../../../components/text/LinkText";
import ErrorText from "../../../components/text/ErrorText";
import { LoginUseCase } from "../application/LoginUseCase";
import { SupabaseAuthRepository } from "../data/LoginRepository";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .toLowerCase()
    .pipe(z.email({ message: "Enter a valid email" })),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export function AuthModal() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const [loginError, setError] = useState<string | null>(null);
  const { state, closeAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const repo = useMemo(() => new SupabaseAuthRepository(), []);
  const useCase = useMemo(() => new LoginUseCase(repo), [repo]);

  useEffect(() => {
    if (!state.isOpen) {
      reset();
      setError(null);
    }
  }, [state.isOpen, reset]);

  useEffect(() => {
    setError(null);
  }, [watch("email"), watch("password")]);

  if (!state.isOpen) return null;

  const handleSignIn = async (value: FormValues) => {
    const { email, password } = value;

    const result = await useCase.execute(email, password);

    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.success) {
      setError(null);
      closeAuthModal();
      if (state.redirectTo) {
        navigate(state.redirectTo);
      }
    }
  };

  return (
    <CustomModal onClose={closeAuthModal}>
      <form onSubmit={handleSubmit(handleSignIn)}>
        <div className="flex flex-col min-w-[500px] shrink-0 items-center gap-10 m-6">
          <div className="relative flex items-center justify-center">
            <span className="inline-flex flex-col gap-2">
              <SvgIcon size={"xxl"} Icon={META_ICONS.userIcon} />
              <CustomText textVariant="primary" textSize="xl">
                {"Sign in to your account."}
              </CustomText>
            </span>

            <ErrorText
              error={loginError?.toString()}
              className="absolute -bottom-6"
            />
          </div>

          <span className="inline-flex flex-col gap-7">
            <FloatingInputField
              type="text"
              leadingIcon={<SvgIcon size={"sm"} Icon={META_ICONS.emailIcon} />}
              {...register("email")}
              label={"Enter email"}
              error={errors.email?.message}
            />

            <FloatingInputField
              type="password"
              onIconClick={setShowPassword}
              leadingIcon={<SvgIcon size={"sm"} Icon={META_ICONS.lockIcon} />}
              {...register("password")}
              label={"Enter password"}
              error={errors.password?.message}
            />
          </span>

          <span className="relative inline-flex flex-col gap-5 items-center">
            <LoginButton isFormSubmitting={isSubmitting} />

            <LinkText linkText={"Forgot password"}></LinkText>
            <span className="inline-flex gap-2">
              <CustomText textVariant="primary">
                {"Don’t have an account?"}
              </CustomText>
              <LinkText linkText={"Sign up"}></LinkText>
            </span>
          </span>

          <span className="inline-flex flex-col gap-2 items-center">
            <CustomText as="p" textSize="xsm">
              {"or"}
            </CustomText>
            <CustomText as="p">{"Continue with"}</CustomText>
          </span>
          <OtherWaysToSignIn />
        </div>
      </form>
    </CustomModal>
  );
}

function OtherWaysToSignIn() {
  const iconTextGap = "2";
  const iconSize = "md";
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
    <div className="flex items-center gap-10">
      <InlineRow gap={iconTextGap} onClick={onFacebook}>
        <SvgIcon size={iconSize} Icon={META_ICONS.facebookIcon} />
        <CustomText textVariant="primary">{"Facebook"}</CustomText>
      </InlineRow>
      <InlineRow gap={iconTextGap} onClick={onGoogle}>
        <SvgIcon size={iconSize} Icon={META_ICONS.googleIcon} />
        <CustomText textVariant="primary">{"Google"}</CustomText>
      </InlineRow>
      <InlineRow gap={iconTextGap} onClick={onTwitter}>
        <SvgIcon size={iconSize} Icon={META_ICONS.twitterIcon} />
        <CustomText textVariant="primary">{"Twitter"}</CustomText>
      </InlineRow>
    </div>
  );
}

function LoginButton({ isFormSubmitting }: { isFormSubmitting: boolean }) {
  return (
    <Button
      disabled={isFormSubmitting}
      type="submit"
      aria-busy={isFormSubmitting}
      variant={"primary"}
      size={"md"}
      isBusy={isFormSubmitting}
      leadingIcon={undefined}
    >
      <span className="inline-flex items-center gap-2 min-w-[150px] justify-center">
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
