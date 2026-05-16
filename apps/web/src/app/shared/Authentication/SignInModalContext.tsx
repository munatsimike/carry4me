import React, { createContext, useContext, useState } from "react";

type SignInModalState = {
  isOpen: boolean;
  redirectTo?: string;
};

type SignInModalContextValue = {
  state: SignInModalState;
  openSignInModal: (opts?: { redirectTo?: string }) => void;
  closeSignInModal: () => void;
};

const SignInModalContext = createContext<SignInModalContextValue | null>(null);

export function SignInModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SignInModalState>({
    isOpen: false,
  });

  function openSignInModal(opts?: { redirectTo?: string }) {
    setState({
      isOpen: true,
      redirectTo: opts?.redirectTo,
    });
  }

  function closeSignInModal() {
    setState((prev) => ({ ...prev, isOpen: false }));
  }

  return (
    <SignInModalContext.Provider
      value={{ state, openSignInModal, closeSignInModal }}
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
