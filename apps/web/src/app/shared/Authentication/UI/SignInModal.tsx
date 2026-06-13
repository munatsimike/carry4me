import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomModal from "@/app/components/CustomModal";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import LineDivider from "@/app/components/LineDivider";
import { useSignInModal } from "../SignInModalContext";
import {
  checkPasskeyBrowserSupport,
  signInWithPasskey,
} from "../application/passkeyAuth";
import { supabase } from "@/app/shared/supabase/client";
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

type SignInTab = "passkey" | "phone" | "email";

type EmailOtpFunctionErrorPayload = {
  error?: string;
  retry_after_seconds?: number;
};

type ResponseLike = {
  status?: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

async function readEmailOtpFunctionError(
  err: unknown,
): Promise<{
  message?: string;
  retryAfterSeconds?: number;
  status?: number;
  rawMessage?: string;
}> {
  const rawMessage = err instanceof Error
    ? err.message
    : typeof err === "string"
      ? err
      : undefined;

  if (!err || typeof err !== "object" || !("context" in err)) {
    return { rawMessage };
  }

  const context = (err as { context?: unknown }).context as ResponseLike | undefined;
  if (!context || typeof context !== "object") {
    return { rawMessage };
  }

  let message: string | undefined;
  let retryAfterSeconds: number | undefined;

  try {
    if (typeof context.json === "function") {
      const payload = (await context.json()) as EmailOtpFunctionErrorPayload;
      if (typeof payload.error === "string" && payload.error.trim()) {
        message = payload.error.trim();
      }
      if (typeof payload.retry_after_seconds === "number") {
        retryAfterSeconds = payload.retry_after_seconds;
      }
    }
  } catch {
    try {
      if (typeof context.text === "function") {
        const textBody = await context.text();
        if (textBody.trim()) {
          message = textBody.trim();
        }
      }
    } catch {
      // Ignore unreadable response bodies and fall back to default mapping.
    }
  }

  return {
    message,
    retryAfterSeconds,
    status: typeof context.status === "number" ? context.status : undefined,
    rawMessage,
  };
}

function validateEmailValue(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Enter a valid email address.";
  }
  return null;
}

function toEmailOtpErrorMessage(
  err: unknown,
  fallbackMessage: string,
): string {
  const fallback = fallbackMessage.trim();
  const base = toFriendlyErrorMessage(err);
  const normalized = base.toLowerCase();

  if (normalized.includes("phone number")) {
    return fallback;
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many") ||
    normalized.includes("wait a moment")
  ) {
    return "Please wait a moment before requesting another code.";
  }

  if (normalized.includes("not found") || normalized.includes("404")) {
    return "Email OTP service is currently unavailable. Please try again shortly.";
  }

  return base || fallback;
}

export function SignInModal() {
  const navigate = useNavigate();
  const {
    state,
    closeSignInModal,
    openSignUpModal,
    openPhoneOtpModal,
    openEmailOtpModal,
  } =
    useSignInModal();
  const {
    setPhoneNumber,
    setSelectedCountryCode,
    setStep,
    setLoading: setPhoneLoading,
  } = usePhoneVerification();
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const sendOTPUseCase = useMemo(() => new SendPhoneOTPUseCase(authRepo), [authRepo]);

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

  const isOpen = state.isOpen && state.view === "signin";
  useEffect(() => {
    if (isOpen) {
      setActiveTab(state.signInDefaultTab);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, state.signInDefaultTab]);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [activeTab]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    reset({
      countryCode: "",
      phoneNumber: "",
    });
    setEmail("");
    setEmailInputError(null);
    setError(null);
    setSuccessMessage(null);
    closeSignInModal();
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
      navigate(state.redirectTo || "/dashboard", { replace: true });
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
      const { data, error: fnError } = await supabase.functions.invoke<{
        ok?: boolean;
        cooldown_seconds?: number;
      }>("send-email-login-otp", {
        body: { email: normalized },
        method: "POST",
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.ok) {
        setEmail("");
        setEmailInputError(null);
        openEmailOtpModal(normalized, { redirectTo: state.redirectTo });
        return;
      }

      throw new Error("Could not send email code.");
    } catch (err) {
      console.error("[Email OTP] send failed:", err);
      const errorDetail = await readEmailOtpFunctionError(err);
      const normalizedMessage = (errorDetail.message ?? "").toLowerCase();
      const cooldownSeconds =
        errorDetail.retryAfterSeconds ??
        (errorDetail.status === 429 ? 60 : undefined);

      if (
        typeof cooldownSeconds === "number" &&
        Number.isFinite(cooldownSeconds) &&
        cooldownSeconds > 0
      ) {
        setEmail("");
        setEmailInputError(null);
        openEmailOtpModal(normalized, { redirectTo: state.redirectTo });
        return;
      }

      if (
        errorDetail.status !== undefined &&
        errorDetail.status >= 500 &&
        errorDetail.status < 600
      ) {
        setEmail("");
        setEmailInputError(null);
        openEmailOtpModal(normalized, { redirectTo: state.redirectTo });
        return;
      }

      if (normalizedMessage.includes("wait before requesting another code")) {
        setEmail("");
        setEmailInputError(null);
        openEmailOtpModal(normalized, { redirectTo: state.redirectTo });
        return;
      }

      if (
        errorDetail.status === 404 ||
        normalizedMessage.includes("account not found") ||
        normalizedMessage.includes("sign in with phone otp")
      ) {
        setError("Account not found or incomplete. Sign in with Phone OTP.");
        return;
      }

      if (
        errorDetail.status === 403 ||
        normalizedMessage.includes("phone otp first") ||
        normalizedMessage.includes("complete your profile and phone verification") ||
        normalizedMessage.includes("sign in with phone otp")
      ) {
        setError("Account not found or incomplete. Sign in with Phone OTP.");
        return;
      }

      setError(
        errorDetail.message
          ? toEmailOtpErrorMessage(
            new Error(errorDetail.message),
            "We couldn’t send an email code right now. Please try again.",
          )
          : errorDetail.rawMessage
            ? toEmailOtpErrorMessage(
              new Error(errorDetail.rawMessage),
              "We couldn’t send an email code right now. Please try again.",
            )
          : toEmailOtpErrorMessage(
            err,
            "We couldn’t send an email code right now. Please try again.",
          ),
      );
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  return (
    <AnimatePresence>
      <CustomModal
        onClose={handleCloseModal}
        width="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-center items-center">
            <CustomText textSize="xl" textVariant="primary" className="font-medium">
              Sign in
            </CustomText>
            <CustomText textSize="sm" textVariant="secondary">
              Use a passkey for the fastest and safest sign-in.
            </CustomText>
          </div>

          <LineDivider heightClass="my-0" />

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={activeTab === "passkey" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("passkey")}
            >
              Passkey
            </Button>
            <Button
              type="button"
              variant={activeTab === "email" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("email")}
            >
              Email OTP
            </Button>
            <Button
              type="button"
              variant={activeTab === "phone" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("phone")}
            >
              Phone OTP
            </Button>
          </div>

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
                    Continue with Passkey
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
                    Send OTP
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
                    Send OTP
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
      </CustomModal>
    </AnimatePresence>
  );
}
