import React from "react";
import { UniversalModalProvider } from "./DialogBoxModalProvider";
import { AuthProvider } from "../../supabase/AuthProvider";
import { ToastProvider } from "@/app/components/Toast";
import { AuthModalProvider } from "../AuthModalContext";
import { GoodsProvider } from "../UI/GoodsProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthModalProvider>
          <UniversalModalProvider>
            <GoodsProvider>{children}</GoodsProvider>
          </UniversalModalProvider>
        </AuthModalProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
