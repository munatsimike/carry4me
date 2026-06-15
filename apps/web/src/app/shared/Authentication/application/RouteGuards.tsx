import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useToast } from "@/app/components/Toast";
import { useAuth } from "../../supabase/AuthProvider";
import {
  getAccountActionBlockReason,
  getDefaultAuthedPath,
  isSuspended,
} from "../domain/accountStatus";
import {
  COMPLETE_PROFILE_PATH,
  isProfileIncomplete,
  needsCompleteProfile,
} from "../domain/profileCompletion";
import { useEmailVerification } from "../UI/EmailVerificationContext";

type GuardProps = {
  children: ReactNode;
};

type ProtectedRouteProps = GuardProps & {
  requireCompleteProfile?: boolean;
  blockSuspended?: boolean;
  blockPendingReviewActions?: boolean;
};

function RedirectWithToast({
  to,
  message,
}: {
  to: string;
  message?: string;
}) {
  const { toast } = useToast();

  useEffect(() => {
    if (!message) return;
    toast(message, { variant: "warning" });
  }, [message, toast]);

  return <Navigate to={to} replace />;
}

export function ProtectedRoute({
  children,
  requireCompleteProfile = true,
  blockSuspended = true,
  blockPendingReviewActions = false,
}: ProtectedRouteProps) {
  const { loading, user, profile } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (
    requireCompleteProfile &&
    profile &&
    needsCompleteProfile(profile) &&
    location.pathname !== COMPLETE_PROFILE_PATH
  ) {
    return (
      <Navigate
        to={COMPLETE_PROFILE_PATH}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (blockSuspended && isSuspended(profile)) {
    return (
      <RedirectWithToast
        to="/"
        message={getAccountActionBlockReason(profile, "post_listing") ?? undefined}
      />
    );
  }

  if (blockPendingReviewActions) {
    const reason = getAccountActionBlockReason(profile, "post_listing");

    if (reason) {
      return <RedirectWithToast to="/dashboard" message={reason} />;
    }
  }

  return children;
}

export function CompleteProfileRoute({ children }: GuardProps) {
  const { loading, user, profile } = useAuth();
  const { isBlockingCompleteProfileRedirect } = useEmailVerification();

  if (loading && !isBlockingCompleteProfileRedirect) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (
    profile &&
    !isProfileIncomplete(profile) &&
    !isBlockingCompleteProfileRedirect
  ) {
    return <Navigate to={getDefaultAuthedPath(profile)} replace />;
  }

  if (isSuspended(profile)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
