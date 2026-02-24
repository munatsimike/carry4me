import React, { createContext, useContext } from "react";

import type { UserProfile } from "../domain/authTypes";

type AuthContextValue = {
  authChecked: boolean;
  userId: string | null;
  userLoggedIn: boolean;
  profile: UserProfile | null;
  loadingProfile: boolean;
  error: string | null; // UI-friendly string
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    authChecked,
    userId,
    userLoggedIn,
    profile,
    loadingProfile,
    error,
    refreshProfile,
  } = useAuthProfile();

  return (
    <AuthContext.Provider
      value={{
        authChecked,
        userId,
        userLoggedIn,
        profile,
        loadingProfile,
        error,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
