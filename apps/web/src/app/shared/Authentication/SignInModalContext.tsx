import React, { createContext, useContext, useState } from "react";

export type PhoneOtpMode = "signin" | "signup";
export type AuthModalView =
  | "signin"
  | "phone-otp"
  | "email-otp"
  | "phone-change-otp"
  | null;
export type SignInDefaultTab = "passkey" | "email" | "phone";

export type PhoneChangeOtpPayload = {
  userId: string;
  phoneNumber: string;
  countryCode: string;
};

export function isAuthModalActive(state: { isOpen: boolean }): boolean {
  return state.isOpen;
}

type SignInModalState = {
  isOpen: boolean;
  view: AuthModalView;
  phoneOtpMode: PhoneOtpMode;
  emailOtpAddress: string | null;
  phoneChange: PhoneChangeOtpPayload | null;
  signInDefaultTab: SignInDefaultTab;
  redirectTo?: string;
};

type SignInModalContextValue = {
  state: SignInModalState;
  openSignInModal: (opts?: {
    redirectTo?: string;
    defaultTab?: SignInDefaultTab;
  }) => void;
  openPhoneOtpModal: (mode: PhoneOtpMode, opts?: { redirectTo?: string }) => void;
  openEmailOtpModal: (email: string, opts?: { redirectTo?: string }) => void;
  openPhoneChangeOtpModal: (payload: PhoneChangeOtpPayload) => void;
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
    phoneChange: null,
    signInDefaultTab: "passkey",
  });

  function openSignInModal(opts?: {
    redirectTo?: string;
    defaultTab?: SignInDefaultTab;
  }) {
    if (opts?.defaultTab === "phone") {
      openPhoneOtpModal("signin", { redirectTo: opts?.redirectTo });
      return;
    }

    setState((prev) => ({
      ...prev,
      isOpen: true,
      view: "signin",
      phoneOtpMode: "signin",
      emailOtpAddress: null,
      phoneChange: null,
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
      phoneChange: null,
      signInDefaultTab: mode === "signin" ? "phone" : "passkey",
      redirectTo: opts?.redirectTo ?? prev.redirectTo,
    }));
  }

  function openEmailOtpModal(email: string, opts?: { redirectTo?: string }) {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      view: "email-otp",
      phoneOtpMode: "signin",
      emailOtpAddress: email,
      phoneChange: null,
      signInDefaultTab: "email",
      redirectTo: opts?.redirectTo,
    }));
  }

  function openPhoneChangeOtpModal(payload: PhoneChangeOtpPayload) {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      view: "phone-change-otp",
      phoneOtpMode: "signin",
      emailOtpAddress: null,
      phoneChange: payload,
      redirectTo: undefined,
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
      emailOtpAddress: null,
      phoneChange: null,
    }));
  }

  return (
    <SignInModalContext.Provider
      value={{
        state,
        openSignInModal,
        openPhoneOtpModal,
        openEmailOtpModal,
        openPhoneChangeOtpModal,
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
