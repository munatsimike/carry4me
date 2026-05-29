import CustomModal from "@/app/components/CustomModal";
import LineDivider from "@/app/components/LineDivider";
import Spinner from "@/app/components/Spinner";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { sendEmailVerification } from "@/app/shared/supabase/sendEmailVerification";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import { getWebmailAction } from "../application/emailWebmail";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { AnimatePresence } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

type EmailVerificationModalMode = "check-email" | "verify-required" | null;

type CheckEmailModalSource = "default" | "profile-saved";

type CheckEmailModalState = {
  email?: string;
  source: CheckEmailModalSource;
  onDismiss?: () => void;
};

type OpenCheckEmailModalOptions = {
  email?: string;
  source?: CheckEmailModalSource;
  onDismiss?: () => void;
};

type EmailVerificationContextValue = {
  openCheckEmailModal: (options?: OpenCheckEmailModalOptions) => void;
  openVerifyEmailModal: () => void;
  closeEmailVerificationModal: () => void;
  isBlockingCompleteProfileRedirect: boolean;
  setPostProfileSaveFlowActive: (active: boolean) => void;
};

const EmailVerificationContext =
  createContext<EmailVerificationContextValue | null>(null);

export function EmailVerificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setMode] = useState<EmailVerificationModalMode>(null);
  const [checkEmailModal, setCheckEmailModal] =
    useState<CheckEmailModalState | null>(null);
  const [postProfileSaveFlowActive, setPostProfileSaveFlowActive] =
    useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();
  const { showSupabaseError } = useUniversalModal();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const verificationEmail =
    profile?.email?.trim() || user?.email?.trim() || "";

  const closeEmailVerificationModal = useCallback(() => {
    const onDismiss = checkEmailModal?.onDismiss;
    setMode(null);
    setCheckEmailModal(null);
    setResendLoading(false);
    onDismiss?.();
  }, [checkEmailModal?.onDismiss]);

  const openCheckEmailModal = useCallback(
    (options?: OpenCheckEmailModalOptions) => {
      setCheckEmailModal({
        email: options?.email,
        source: options?.source ?? "default",
        onDismiss: options?.onDismiss,
      });
      setMode("check-email");
    },
    [],
  );

  const openVerifyEmailModal = useCallback(() => {
    setMode("verify-required");
  }, []);

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    try {
      await sendEmailVerification();
      toast("Verification email sent.", { variant: "success" });
    } catch (error) {
      showSupabaseError(error);
    } finally {
      setResendLoading(false);
    }
  }, [showSupabaseError, toast]);

  const value = useMemo(
    () => ({
      openCheckEmailModal,
      openVerifyEmailModal,
      closeEmailVerificationModal,
      isBlockingCompleteProfileRedirect: postProfileSaveFlowActive,
      setPostProfileSaveFlowActive,
    }),
    [
      closeEmailVerificationModal,
      openCheckEmailModal,
      openVerifyEmailModal,
      postProfileSaveFlowActive,
    ],
  );

  const isCheckEmail = mode === "check-email";
  const isVerifyRequired = mode === "verify-required";
  const isProfileSaved = checkEmailModal?.source === "profile-saved";
  const webmailAction = checkEmailModal?.email
    ? getWebmailAction(checkEmailModal.email)
    : null;

  const handleCheckEmailDismiss = useCallback(() => {
    closeEmailVerificationModal();
  }, [closeEmailVerificationModal]);

  const handleOpenWebmail = useCallback(() => {
    if (webmailAction) {
      window.open(webmailAction.url, "_blank", "noopener,noreferrer");
    }
    closeEmailVerificationModal();
  }, [closeEmailVerificationModal, webmailAction]);

  const handleChangeEmail = useCallback(() => {
    closeEmailVerificationModal();
    navigate("/profile?edit=security");
  }, [closeEmailVerificationModal, navigate]);

  return (
    <EmailVerificationContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {mode && (
          <CustomModal width="lg" onClose={closeEmailVerificationModal}>
            <div className="flex flex-col gap-2 p-4">
              <CustomText
                textVariant="primary"
                textSize="lg"
                className="font-medium"
              >
                {isCheckEmail
                  ? isProfileSaved
                    ? "Profile saved"
                    : "Check your email"
                  : "Verify your email"}
              </CustomText>

              {isVerifyRequired ? (
                verificationEmail ? (
                  <CustomText textVariant="secondary" textSize="sm">
                    We sent a verification link to{" "}
                    <span className="font-medium text-neutral-800">
                      {verificationEmail}
                    </span>
                    . Click the link to verify your email address.
                  </CustomText>
                ) : (
                  <CustomText textVariant="secondary" textSize="sm">
                    We sent a verification link to your email. Click the link
                    to verify your email address.
                  </CustomText>
                )
              ) : (
                <CustomText textVariant="secondary" textSize="sm">
                  {isCheckEmail
                    ? isProfileSaved
                      ? "Your profile has been saved. We sent a verification link to your email address. Please verify it before posting parcels or trips."
                      : "We sent a verification link to your email. Please verify it before posting parcels or trips."
                    : ""}
                </CustomText>
              )}

              {isVerifyRequired ? (
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="w-fit text-sm font-medium text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
                >
                  Change email
                </button>
              ) : null}

              <LineDivider heightClass="my-2" />

              <div className="mt-1 flex justify-end gap-3">
                {isVerifyRequired && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeEmailVerificationModal}
                    disabled={resendLoading}
                  >
                    <CustomText textVariant="primary">Close</CustomText>
                  </Button>
                )}

                {isVerifyRequired ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => void handleResend()}
                    disabled={resendLoading}
                    className="min-w-[11rem] !px-6"
                  >
                    {resendLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        <CustomText textVariant="onDark" textSize="sm">
                          Sending…
                        </CustomText>
                      </span>
                    ) : (
                      <CustomText textVariant="onDark" textSize="sm">
                        Resend verification email
                      </CustomText>
                    )}
                  </Button>
                ) : isCheckEmail && webmailAction ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCheckEmailDismiss}
                      className="!px-6"
                    >
                      <CustomText textVariant="primary">Close</CustomText>
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleOpenWebmail}
                      className="!px-6"
                    >
                      <CustomText textVariant="onDark">
                        {webmailAction.label}
                      </CustomText>
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCheckEmailDismiss}
                    className="!px-6"
                  >
                    <CustomText textVariant="onDark">Okay</CustomText>
                  </Button>
                )}
              </div>
            </div>
          </CustomModal>
        )}
      </AnimatePresence>
    </EmailVerificationContext.Provider>
  );
}

export function useEmailVerification() {
  const context = useContext(EmailVerificationContext);
  if (!context) {
    throw new Error(
      "useEmailVerification must be used inside <EmailVerificationProvider />",
    );
  }
  return context;
}
