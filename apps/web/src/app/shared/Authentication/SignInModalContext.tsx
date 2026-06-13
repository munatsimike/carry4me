import React, { createContext, useContext, useState } from "react";

export type PhoneOtpMode = "signin" | "signup";
export type AuthModalView = "signin" | "phone-otp" | null;

type SignInModalState = {
  isOpen: boolean;
  view: AuthModalView;
  phoneOtpMode: PhoneOtpMode;
  redirectTo?: string;
};

type SignInModalContextValue = {
  state: SignInModalState;
  openSignInModal: (opts?: { redirectTo?: string }) => void;
  openPhoneOtpModal: (mode: PhoneOtpMode, opts?: { redirectTo?: string }) => void;
  openSignUpModal: (opts?: { redirectTo?: string }) => void;
  closeSignInModal: () => void;
};

const SignInModalContext = createContext<SignInModalContextValue | null>(null);

export function SignInModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SignInModalState>({
    isOpen: false,
    view: null,
    phoneOtpMode: "signup",
  });

  function openSignInModal(opts?: { redirectTo?: string }) {
    setState({
      isOpen: true,
      view: "signin",
      phoneOtpMode: "signin",
      redirectTo: opts?.redirectTo,
    });
  }

  function openPhoneOtpModal(
    mode: PhoneOtpMode,
    opts?: { redirectTo?: string },
  ) {
    setState({
      isOpen: true,
      view: "phone-otp",
      phoneOtpMode: mode,
      redirectTo: opts?.redirectTo,
    });
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
