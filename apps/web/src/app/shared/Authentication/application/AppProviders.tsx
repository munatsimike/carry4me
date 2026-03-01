import React from "react";
import { UniversalModalProvider } from "./DialogBoxModalProvider";
import { AuthProvider } from "../../supabase/AuthProvider";
import { ToastProvider } from "@/app/components/Toast";
import { AuthModalProvider } from "../AuthModalContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthModalProvider>
          <UniversalModalProvider>
            {children}
          </UniversalModalProvider>
        </AuthModalProvider>
      </ToastProvider>
    </AuthProvider>
  );
}