import { AnimatePresence } from "framer-motion";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { PhoneEntryScreen } from "./PhoneEntryScreen";
import { OTPVerificationScreen } from "./OTPVerificationScreen";
import CustomModal from "@/app/components/CustomModal";
import { useSignInModal } from "../SignInModalContext";

export function PhoneVerificationModal() {
  const { step, setStep, resetPhoneVerification } = usePhoneVerification();
  const { state, closeSignInModal } = useSignInModal();
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

  const handleVerificationComplete = () => {
    resetPhoneVerification();
    closeSignInModal();
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <CustomModal onClose={handleClose} width="xl">
          {step === "phone-entry" && (
            <PhoneEntryScreen onPhoneSubmitted={handlePhoneSubmitted} />
          )}

          {step === "otp-verification" && (
            <OTPVerificationScreen
              onVerificationComplete={handleVerificationComplete}
              onPhoneEdit={handlePhoneEdit}
            />
          )}
        </CustomModal>
      )}
    </AnimatePresence>
  );
}
