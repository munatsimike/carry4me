import CustomModal from "@/app/components/CustomModal";
import LineDivider from "@/app/components/LineDivider";
import Spinner from "@/app/components/Spinner";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { sendEmailVerification } from "@/app/shared/supabase/sendEmailVerification";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import { AnimatePresence } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type EmailVerificationModalMode = "check-email" | "verify-required" | null;

type EmailVerificationContextValue = {
  openCheckEmailModal: () => void;
  openVerifyEmailModal: () => void;
  closeEmailVerificationModal: () => void;
};

const EmailVerificationContext =
  createContext<EmailVerificationContextValue | null>(null);

export function EmailVerificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setMode] = useState<EmailVerificationModalMode>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();
  const { showSupabaseError } = useUniversalModal();

  const closeEmailVerificationModal = useCallback(() => {
    setMode(null);
    setResendLoading(false);
  }, []);

  const openCheckEmailModal = useCallback(() => {
    setMode("check-email");
  }, []);

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
    }),
    [closeEmailVerificationModal, openCheckEmailModal, openVerifyEmailModal],
  );

  const isCheckEmail = mode === "check-email";
  const isVerifyRequired = mode === "verify-required";

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
                {isCheckEmail ? "Check your email" : "Verify your email"}
              </CustomText>

              <CustomText textVariant="secondary" textSize="sm">
                {isCheckEmail
                  ? "We sent a verification link to your email. Please verify it before posting parcels or trips."
                  : "Please verify your email before posting parcels or trips on Carry4Me."}
              </CustomText>

              <LineDivider heightClass="my-2" />

              <div className="flex justify-end gap-3  mt-1">
                {isVerifyRequired && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeEmailVerificationModal}
                    disabled={resendLoading}
                  >
                    <CustomText textVariant="primary">Cancel</CustomText>
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
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={closeEmailVerificationModal}
                    className="!px-6"
                  >
                    <CustomText textVariant="onDark">Got it</CustomText>
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
