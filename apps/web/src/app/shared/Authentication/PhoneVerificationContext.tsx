import React, { createContext, useContext, useState } from "react";

type PhoneVerificationStep = "phone-entry" | "otp-verification" | "completed";

type PhoneVerificationContextValue = {
  phoneNumber: string;
  step: PhoneVerificationStep;
  isLoading: boolean;
  error: string | null;

  setPhoneNumber: (phone: string) => void;
  setStep: (step: PhoneVerificationStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  resetPhoneVerification: () => void;
};

const PhoneVerificationContext =
  createContext<PhoneVerificationContextValue | null>(null);

export function PhoneVerificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [step, setStep] = useState<PhoneVerificationStep>("phone-entry");
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetPhoneVerification = () => {
    setPhoneNumber("");
    setStep("phone-entry");
    setLoading(false);
    setError(null);
  };

  return (
    <PhoneVerificationContext.Provider
      value={{
        phoneNumber,
        step,
        isLoading,
        error,
        setPhoneNumber,
        setStep,
        setLoading,
        setError,
        resetPhoneVerification,
      }}
    >
      {children}
    </PhoneVerificationContext.Provider>
  );
}

export function usePhoneVerification() {
  const ctx = useContext(PhoneVerificationContext);
  if (!ctx) {
    throw new Error(
      "usePhoneVerification must be used within PhoneVerificationProvider",
    );
  }
  return ctx;
}
