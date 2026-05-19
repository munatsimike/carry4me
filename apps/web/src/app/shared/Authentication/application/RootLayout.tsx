import { UniversalModalProvider } from "./DialogBoxModalProvider";
import { SignInModalProvider } from "../SignInModalContext";
import { UIProvider } from "../UI/hooks/useUI";
import { PhoneVerificationProvider } from "../PhoneVerificationContext";
import { EmailVerificationProvider } from "../UI/EmailVerificationContext";
import RootLayoutContent from "@/app/RootLayoutContent";

export function RootLayout() {
  return (
    <UIProvider>
      <UniversalModalProvider>
        <SignInModalProvider>
          <PhoneVerificationProvider>
            <EmailVerificationProvider>
              <RootLayoutContent />
            </EmailVerificationProvider>
          </PhoneVerificationProvider>
        </SignInModalProvider>
      </UniversalModalProvider>
    </UIProvider>
  );
}
