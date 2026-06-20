import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomModal from "@/app/components/CustomModal";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import LineDivider from "@/app/components/LineDivider";
import Spinner from "@/app/components/Spinner";
import { useSignInModal } from "../SignInModalContext";
import {
  checkPasskeyBrowserSupport,
  signInWithPasskey,
} from "../application/passkeyAuth";
import PhoneNumberWithCountryFields from "./components/PhoneNumberWithCountryFields";
import {
  phoneWithCountrySchema,
  type PhoneWithCountryFields,
} from "../validation/phoneWithCountrySchema";
import { toE164PhoneNumber } from "../application/toE164PhoneNumber";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { SendPhoneOTPUseCase } from "../application/SendPhoneOTPUseCase";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { toFriendlyErrorMessage } from "../application/normalizeSupabaseError";
import { toEmailOtpLoginErrorMessage } from "../application/emailOtpLoginErrors";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { resolveAuthenticatedLandingPath } from "../application/postAuthNavigation";
import { usePasskeyPrompt } from "./PasskeyPromptProvider";
import { SignInModalTabs, type SignInTab } from "./SignInModalTabs";
import { PhoneEntryScreen } from "./PhoneEntryScreen";
import { OTPVerificationScreen } from "./OTPVerificationScreen";
import { EmailOTPVerificationScreen } from "./EmailOTPVerificationScreen";

function validateEmailValue(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function SignInModal() {
  const navigate = useNavigate();
  const {
    state,
    closeSignInModal,
    openSignUpModal,
    openPhoneOtpModal,
    openEmailOtpModal,
  } = useSignInModal();
  const {
    step,
    setPhoneNumber,
    setSelectedCountryCode,
    setStep,
    setLoading: setPhoneLoading,
    resetPhoneVerification,
  } = usePhoneVerification();
  const { refreshProfile, user } = useAuth();
  const { requestPasskeyPromptCheck } = usePasskeyPrompt();
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const sendOTPUseCase = useMemo(() => new SendPhoneOTPUseCase(authRepo), [authRepo]);
  const phoneOtpFlowRef = useRef<"signin" | "signup" | null>(null);

  const [activeTab, setActiveTab] = useState<SignInTab>("passkey");
  const [loadingPasskey, setLoadingPasskey] = useState(false);
  const [loadingPhoneOtp, setLoadingPhoneOtp] = useState(false);
  const [loadingEmailOtp, setLoadingEmailOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailInputError, setEmailInputError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError: setFieldError,
    formState: { errors, dirtyFields, touchedFields },
  } = useForm<PhoneWithCountryFields>({
    resolver: zodResolver(phoneWithCountrySchema),
    defaultValues: {
      countryCode: "",
      phoneNumber: "",
    },
    mode: "onTouched",
  });

  const isAuthModalOpen = state.isOpen && !user && state.view !== null;
  const isSignInView = state.view === "signin";

  useEffect(() => {
    if (!isAuthModalOpen || state.view !== "phone-otp") {
      phoneOtpFlowRef.current = null;
      return;
    }

    if (phoneOtpFlowRef.current !== state.phoneOtpMode) {
      if (step === "phone-entry") {
        resetPhoneVerification();
      }
      phoneOtpFlowRef.current = state.phoneOtpMode;
    }
  }, [
    isAuthModalOpen,
    resetPhoneVerification,
    state.phoneOtpMode,
    state.view,
    step,
  ]);

  useEffect(() => {
    if (isSignInView) {
      setActiveTab(state.signInDefaultTab);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isSignInView, state.signInDefaultTab]);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [activeTab]);

  const handleCloseModal = () => {
    reset({
      countryCode: "",
      phoneNumber: "",
    });
    setEmail("");
    setEmailInputError(null);
    setError(null);
    setSuccessMessage(null);
    resetPhoneVerification();
    closeSignInModal();
  };

  const handleVerificationComplete = async () => {
    const redirectTo = state.redirectTo;

    await refreshProfile({ silent: true });
    resetPhoneVerification();
    closeSignInModal();
    requestPasskeyPromptCheck();
    navigate(await resolveAuthenticatedLandingPath(redirectTo), { replace: true });
  };

  const handlePasskeySignIn = async () => {
    setLoadingPasskey(true);
    setError(null);
    try {
      const support = await checkPasskeyBrowserSupport();
      if (!support.supported) {
        console.error("[Passkey] Unsupported device/browser:", {
          reason: support.reason,
          detail: support.detail,
        });
        setError("Passkeys are not available on this device. Please use Phone or Email OTP instead.");
        return;
      }

      await signInWithPasskey();
      closeSignInModal();
      await refreshProfile();
      requestPasskeyPromptCheck();
      navigate(await resolveAuthenticatedLandingPath(state.redirectTo), {
        replace: true,
      });
    } catch (err) {
      console.error("[Passkey] Sign-in failed:", err);
      const message = err instanceof Error ? err.message : "Passkey sign-in failed.";
      setError(message);
    } finally {
      setLoadingPasskey(false);
    }
  };

  const handleSendPhoneOtp = async (values: PhoneWithCountryFields) => {
    const e164PhoneNumber = toE164PhoneNumber(values.countryCode, values.phoneNumber);
    if (!e164PhoneNumber) {
      setFieldError("phoneNumber", {
        message: "Enter a valid local phone number",
      });
      return;
    }

    setLoadingPhoneOtp(true);
    setError(null);
    try {
      setPhoneLoading(true);
      await sendOTPUseCase.execute(e164PhoneNumber);
      setPhoneNumber(e164PhoneNumber);
      setSelectedCountryCode(values.countryCode);
      setStep("otp-verification");
      openPhoneOtpModal("signin", { redirectTo: state.redirectTo });
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setPhoneLoading(false);
      setLoadingPhoneOtp(false);
    }
  };

  const handleSendEmailCode = async () => {
    const normalized = email.trim().toLowerCase();
    const emailValidationError = validateEmailValue(normalized);
    if (emailValidationError) {
      setEmailInputError(emailValidationError);
      return;
    }

    setLoadingEmailOtp(true);
    setError(null);
    setSuccessMessage(null);
    setEmailInputError(null);
    try {
      await authRepo.sendEmailOTP(normalized);
      setEmail("");
      setEmailInputError(null);
      openEmailOtpModal(normalized, { redirectTo: state.redirectTo });
    } catch (err) {
      console.error("[Email OTP] send failed:", err);
      setError(toEmailOtpLoginErrorMessage(err));
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  return (
    <AnimatePresence initial={false}>
      {isAuthModalOpen ? (
        <CustomModal
          onClose={handleCloseModal}
          width={isSignInView ? "lg" : "xl"}
          scrollable={false}
        >
          {isSignInView ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 text-center items-center">
                <CustomText textSize="xl" textVariant="primary" className="font-medium">
                  Sign in
                </CustomText>
                <CustomText textSize="sm" textVariant="secondary">
                  Choose how you want to sign in.
                </CustomText>
              </div>

              <LineDivider heightClass="my-0" />

              <SignInModalTabs activeTab={activeTab} onTabChange={setActiveTab} />

              <div>
                <AnimatePresence mode="wait" initial={false}>
                  {activeTab === "passkey" ? (
                    <motion.div
                      key="signin-passkey-tab"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex flex-col gap-3"
                    >
                      <CustomText textSize="xs" textVariant="secondary" className="text-neutral-400">
                        Passkeys let you sign in with Face ID, fingerprint, Windows Hello,
                        or your device PIN.
                      </CustomText>
                      <LineDivider heightClass="my-0" />
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        isBusy={loadingPasskey}
                        disabled={loadingPasskey}
                        onClick={() => void handlePasskeySignIn()}
                        className="w-full"
                      >
                        Use Passkey
                      </Button>
                    </motion.div>
                  ) : null}

                  {activeTab === "phone" ? (
                    <motion.form
                      key="signin-phone-tab"
                      onSubmit={handleSubmit(handleSendPhoneOtp)}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex flex-col gap-3"
                    >
                      <PhoneNumberWithCountryFields
                        register={register}
                        setValue={setValue}
                        watch={watch}
                        errors={errors}
                        dirtyFields={dirtyFields}
                        touchedFields={touchedFields}
                        disabled={loadingPhoneOtp}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(132px,140px)_minmax(0,1fr)]"
                      />
                      <LineDivider heightClass="my-0" />
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isBusy={loadingPhoneOtp}
                        disabled={loadingPhoneOtp}
                        className="w-full"
                      >
                        Send code
                      </Button>
                    </motion.form>
                  ) : null}

                  {activeTab === "email" ? (
                    <motion.div
                      key="signin-email-tab"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex flex-col gap-1.5">
                        <CustomText as="label" textVariant="label" textSize="xs">
                          Email address
                        </CustomText>
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            if (emailInputError) {
                              setEmailInputError(null);
                            }
                          }}
                          onBlur={() => {
                            const validationError = validateEmailValue(email);
                            setEmailInputError(validationError);
                          }}
                          placeholder="Enter your email"
                          className={`h-11 w-full rounded-xl bg-white px-3 text-sm text-ink-primary outline-none transition-colors ${
                            emailInputError
                              ? "border border-red-400 focus:border-red-500"
                              : "border border-neutral-300 focus:border-primary-500"
                          }`}
                          autoComplete="email"
                        />
                        {emailInputError ? (
                          <CustomText textSize="xs" className="text-red-600">
                            {emailInputError}
                          </CustomText>
                        ) : null}
                      </div>
                      <LineDivider heightClass="my-0" />
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        isBusy={loadingEmailOtp}
                        disabled={loadingEmailOtp}
                        onClick={() => void handleSendEmailCode()}
                        className="w-full"
                      >
                        {loadingEmailOtp ? (
                          <>
                            <Spinner />
                            <span className="ml-2">Processing...</span>
                          </>
                        ) : (
                          "Send code"
                        )}
                      </Button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {error ? (
                <CustomText textSize="sm" className="text-red-600">
                  {error}
                </CustomText>
              ) : null}

              {successMessage ? (
                <CustomText textSize="sm" className="text-emerald-600">
                  {successMessage}
                </CustomText>
              ) : null}

              <button
                type="button"
                onClick={() => openSignUpModal({ redirectTo: state.redirectTo })}
                className="mt-5 text-sm text-primary-600 hover:underline text-left"
              >
                Don&apos;t have an account? Sign up
              </button>
            </div>
          ) : null}

          {state.view === "phone-otp" && step === "phone-entry" ? (
            <PhoneEntryScreen
              mode={state.phoneOtpMode}
              onPhoneSubmitted={() => undefined}
            />
          ) : null}

          {state.view === "phone-otp" && step === "otp-verification" ? (
            <OTPVerificationScreen
              onVerified={closeSignInModal}
              onVerificationComplete={handleVerificationComplete}
              onPhoneEdit={() => setStep("phone-entry")}
            />
          ) : null}

          {state.view === "email-otp" ? (
            <EmailOTPVerificationScreen
              onVerified={closeSignInModal}
              onVerificationComplete={handleVerificationComplete}
            />
          ) : null}
        </CustomModal>
      ) : null}
    </AnimatePresence>
  );
}
