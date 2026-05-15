import { UniversalModalProvider } from "./DialogBoxModalProvider";
import { AuthModalProvider } from "../AuthModalContext";
import { UIProvider } from "../UI/hooks/useUI";
import { PhoneVerificationProvider } from "../PhoneVerificationContext";
import RootLayoutContent from "@/app/RootLayoutContent";

export function RootLayout() {
  return (
    <UIProvider>
      <UniversalModalProvider>
        <AuthModalProvider>
          <PhoneVerificationProvider>
            <RootLayoutContent />
          </PhoneVerificationProvider>
        </AuthModalProvider>
      </UniversalModalProvider>
    </UIProvider>
  );
}
