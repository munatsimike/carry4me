import React, { createContext, useContext, useState } from "react";

export type PhoneOtpMode = "signin" | "signup";
export type AuthModalView = "signin" | "phone-otp" | "email-otp" | null;
export type SignInDefaultTab = "passkey" | "email" | "phone";

type SignInModalState = {
  isOpen: boolean;
  view: AuthModalView;
  phoneOtpMode: PhoneOtpMode;
  emailOtpAddress: string | null;
  signInDefaultTab: SignInDefaultTab;
  redirectTo?: string;
};

type SignInModalContextValue = {
  state: SignInModalState;
  openSignInModal: (opts?: { redirectTo?: string; defaultTab?: SignInDefaultTab }) => void;
  openPhoneOtpModal: (mode: PhoneOtpMode, opts?: { redirectTo?: string }) => void;
  openEmailOtpModal: (email: string, opts?: { redirectTo?: string }) => void;
  openSignUpModal: (opts?: { redirectTo?: string }) => void;
  closeSignInModal: () => void;
};

const SignInModalContext = createContext<SignInModalContextValue | null>(null);

export function SignInModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SignInModalState>({
    isOpen: false,
    view: null,
    phoneOtpMode: "signup",
    emailOtpAddress: null,
    signInDefaultTab: "passkey",
  });

  function openSignInModal(opts?: { redirectTo?: string; defaultTab?: SignInDefaultTab }) {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      view: "signin",
      phoneOtpMode: "signin",
      emailOtpAddress: null,
      signInDefaultTab: opts?.defaultTab ?? "passkey",
      redirectTo: opts?.redirectTo,
    }));
  }

  function openPhoneOtpModal(
    mode: PhoneOtpMode,
    opts?: { redirectTo?: string },
  ) {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      view: "phone-otp",
      phoneOtpMode: mode,
      emailOtpAddress: null,
      signInDefaultTab: "passkey",
      redirectTo: opts?.redirectTo,
    }));
  }

  function openEmailOtpModal(email: string, opts?: { redirectTo?: string }) {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      view: "email-otp",
      phoneOtpMode: "signin",
      emailOtpAddress: email,
      signInDefaultTab: "email",
      redirectTo: opts?.redirectTo,
    }));
  }

  function openSignUpModal(opts?: { redirectTo?: string }) {
    openPhoneOtpModal("signup", opts);
  }

  function closeSignInModal() {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      view: null,
    }));
  }

  return (
    <SignInModalContext.Provider
      value={{
        state,
        openSignInModal,
        openPhoneOtpModal,
        openEmailOtpModal,
        openSignUpModal,
        closeSignInModal,
      }}
    >
      {children}
    </SignInModalContext.Provider>
  );
}

export function useSignInModal() {
  const ctx = useContext(SignInModalContext);
  if (!ctx) {
    throw new Error("useSignInModal must be used within SignInModalProvider");
  }
  return ctx;
}
