import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useSignInModal } from "../SignInModalContext";

export function AuthEntryButtons({
  className,
}: {
  className?: string;
}) {
  const location = useLocation();
  const { openSignInModal, openSignUpModal } = useSignInModal();

  return (
    <div className={className ?? "flex items-center gap-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => openSignUpModal({ redirectTo: location.pathname })}
      >
        Sign up
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => openSignInModal({ redirectTo: location.pathname })}
      >
        Sign in
      </Button>
    </div>
  );
}
