import React from "react";
import { UniversalModalProvider } from "./DialogBoxModalProvider";
import { AuthProvider } from "../../supabase/AuthProvider";
import { ToastProvider } from "@/app/components/Toast";
import { AuthModalProvider } from "../AuthModalContext";
import { UIProvider } from "../UI/hooks/useUI";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <UIProvider>
          <UniversalModalProvider>
            <AuthModalProvider>{children}</AuthModalProvider>
          </UniversalModalProvider>
        </UIProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
