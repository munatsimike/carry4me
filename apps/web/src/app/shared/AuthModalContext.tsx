import React, { createContext, useContext, useState } from "react";

type AuthMode = "signin" | "signup";

type AuthModalState = {
  isOpen: boolean;
  mode: AuthMode;
  redirectTo?: string;
};

type AuthModalContextValue = {
  state: AuthModalState;
  openAuthModal: (opts: { mode: AuthMode; redirectTo?: string }) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthModalState>({
    isOpen: false,
    mode: "signin",
  });

  function openAuthModal(opts: { mode: AuthMode; redirectTo?: string }) {
    setState({
      isOpen: true,
      mode: opts.mode,
      redirectTo: opts.redirectTo,
    });
  }

  function closeAuthModal() {
    setState((prev) => ({ ...prev, isOpen: false }));
  }

  return (
    <AuthModalContext.Provider value={{ state, openAuthModal, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
