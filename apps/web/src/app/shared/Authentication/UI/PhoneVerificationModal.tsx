import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { usePhoneVerification } from "../PhoneVerificationContext";
import { PhoneEntryScreen } from "./PhoneEntryScreen";
import { OTPVerificationScreen } from "./OTPVerificationScreen";
import CustomModal from "@/app/components/CustomModal";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  userId: string;
  isVerified: boolean;
  onClose: () => void;
}

export function PhoneVerificationModal({
  isOpen,
  userId,
  isVerified,
  onClose
}: PhoneVerificationModalProps) {
  const { step, setStep, resetPhoneVerification } = usePhoneVerification();
  useEffect(() => {
    if (!isOpen || !userId || isVerified) return;
  }, [userId, isVerified]);

  const handleClose = () => {
    resetPhoneVerification();
    onClose();
  };

  const handlePhoneSubmitted = () => {
    // Phone entry submitted, OTP screen will be shown via step change
  };

  const handlePhoneEdit = () => {
    setStep("phone-entry");
  };

  const handleVerificationComplete = () => {
    resetPhoneVerification();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <CustomModal onClose={handleClose}>
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
