import { UniversalModalProvider } from "./DialogBoxModalProvider";
import { AuthModalProvider } from "../AuthModalContext";
import { UIProvider } from "../UI/hooks/useUI";
import RootLayoutContent from "@/app/RootLayoutContent";

export function RootLayout() {
  return (
    <UIProvider>
      <UniversalModalProvider>
        <AuthModalProvider>
          <RootLayoutContent />
        </AuthModalProvider>
      </UniversalModalProvider>
    </UIProvider>
  );
}
