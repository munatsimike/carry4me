import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { PhoneEntryScreen } from "./PhoneEntryScreen";
import { OTPVerificationScreen } from "./OTPVerificationScreen";
import { EmailOTPVerificationScreen } from "./EmailOTPVerificationScreen";
import CustomModal from "@/app/components/CustomModal";
import { useSignInModal } from "../SignInModalContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { resolveAuthenticatedLandingPath } from "../application/postAuthNavigation";

export function PhoneVerificationModal() {
  const { step, setStep, resetPhoneVerification } = usePhoneVerification();
  const { state, closeSignInModal } = useSignInModal();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const phoneOtpFlowRef = useRef<"signin" | "signup" | null>(null);

  const isPhoneOtpOpen =
    state.isOpen && (state.view === "phone-otp" || state.view === "email-otp");

  useEffect(() => {
    if (!isPhoneOtpOpen || state.view !== "phone-otp") {
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
    isPhoneOtpOpen,
    resetPhoneVerification,
    state.phoneOtpMode,
    state.view,
    step,
  ]);

  const handleClose = () => {
    resetPhoneVerification();
    closeSignInModal();
  };

  const handlePhoneSubmitted = () => {
    // Phone entry submitted, OTP screen will be shown via step change
  };

  const handlePhoneEdit = () => {
    setStep("phone-entry");
  };

  const handleAuthModalClose = () => {
    closeSignInModal();
  };

  const handleVerificationComplete = async () => {
    const redirectTo = state.redirectTo;

    await refreshProfile({ silent: true });
    resetPhoneVerification();
    navigate(await resolveAuthenticatedLandingPath(redirectTo), { replace: true });
  };

  return (
    <AnimatePresence>
      {isPhoneOtpOpen && (
        <CustomModal onClose={handleClose} width="xl" scrollable={false}>
          {state.view === "phone-otp" && step === "phone-entry" && (
            <PhoneEntryScreen
              mode={state.phoneOtpMode}
              onPhoneSubmitted={handlePhoneSubmitted}
            />
          )}

          {state.view === "phone-otp" && step === "otp-verification" && (
            <OTPVerificationScreen
              onVerified={handleAuthModalClose}
              onVerificationComplete={handleVerificationComplete}
              onPhoneEdit={handlePhoneEdit}
            />
          )}

          {state.view === "email-otp" && (
            <EmailOTPVerificationScreen
              onVerified={handleAuthModalClose}
              onVerificationComplete={handleVerificationComplete}
            />
          )}
        </CustomModal>
      )}
    </AnimatePresence>
  );
}
