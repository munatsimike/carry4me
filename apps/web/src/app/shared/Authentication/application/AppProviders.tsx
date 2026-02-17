import React from "react";
import { UniversalModalProvider } from "./DialogBoxModalProvider";
import { AuthProvider } from "../../supabase/AuthProvider";
// AppProviders.tsx
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UniversalModalProvider>{children}</UniversalModalProvider>
    </AuthProvider>
  );
}
