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

  const handleVerificationComplete = async () => {
    resetPhoneVerification();
    await refreshProfile();
    const destination = await resolveAuthenticatedLandingPath(state.redirectTo);
    navigate(destination, { replace: true });
    closeSignInModal();
  };

  return (
    <AnimatePresence>
      {state.isOpen && (state.view === "phone-otp" || state.view === "email-otp") && (
        <CustomModal onClose={handleClose} width="xl" scrollable={false}>
          {state.view === "phone-otp" && step === "phone-entry" && (
            <PhoneEntryScreen
              mode={state.phoneOtpMode}
              onPhoneSubmitted={handlePhoneSubmitted}
            />
          )}

          {state.view === "phone-otp" && step === "otp-verification" && (
            <OTPVerificationScreen
              onVerificationComplete={handleVerificationComplete}
              onPhoneEdit={handlePhoneEdit}
            />
          )}

          {state.view === "email-otp" && (
            <EmailOTPVerificationScreen
              onVerificationComplete={handleVerificationComplete}
            />
          )}
        </CustomModal>
      )}
    </AnimatePresence>
  );
}
