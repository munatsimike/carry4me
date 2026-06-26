import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useSignInModal } from "../SignInModalContext";
import { sanitizePostAuthRedirect } from "../application/postAuthNavigation";

export function AuthEntryButtons({
  className,
}: {
  className?: string;
}) {
  const location = useLocation();
  const { openSignInModal, openSignUpModal } = useSignInModal();
  const redirectTo =
    sanitizePostAuthRedirect(location.pathname) ??
    sanitizePostAuthRedirect(
      (location.state as { from?: string } | null)?.from,
    );

  return (
    <div className={className ?? "flex items-center gap-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => openSignUpModal({ redirectTo })}
      >
        Sign up
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => openSignInModal({ redirectTo })}
      >
        Sign in
      </Button>
    </div>
  );
}
