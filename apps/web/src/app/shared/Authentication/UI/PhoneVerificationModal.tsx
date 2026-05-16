import { AnimatePresence } from "framer-motion";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { PhoneEntryScreen } from "./PhoneEntryScreen";
import { OTPVerificationScreen } from "./OTPVerificationScreen";
import CustomModal from "@/app/components/CustomModal";
import { useAuthModal } from "../AuthModalContext";

export function PhoneVerificationModal() {
  const { step, setStep, resetPhoneVerification } = usePhoneVerification();
  const { state, closeAuthModal } = useAuthModal();
  const handleClose = () => {
    resetPhoneVerification();
    closeAuthModal();
  };

  const handlePhoneSubmitted = () => {
    // Phone entry submitted, OTP screen will be shown via step change
  };

  const handlePhoneEdit = () => {
    setStep("phone-entry");
  };

  const handleVerificationComplete = () => {
    resetPhoneVerification();
    closeAuthModal();
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <CustomModal onClose={handleClose} width="lg">
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
