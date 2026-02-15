import React from "react";
import { UniversalModalProvider } from "./DialogBoxModalProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <UniversalModalProvider>{children}</UniversalModalProvider>;
}
