import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/app/components/Toast";
import {
  getAccountActionBlockReason,
  type RestrictedAccountAction,
} from "../../domain/accountStatus";
import {
  COMPLETE_PROFILE_PATH,
  getMarketplaceAccess,
} from "../../domain/marketplaceAccess";
import { useEmailVerification } from "../EmailVerificationContext";
import { useAuth } from "@/app/shared/supabase/AuthProvider";

export function useMarketplaceActionGuard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openVerifyEmailModal } = useEmailVerification();

  const guardAction = useCallback(
    (
      action: () => void,
      blockAction: RestrictedAccountAction = "post_listing",
    ): boolean => {
      const access = getMarketplaceAccess(profile);

      if (!access.allowed) {
        if (access.reason === "complete_profile") {
          navigate(COMPLETE_PROFILE_PATH);
          return false;
        }

        openVerifyEmailModal();
        return false;
      }

      const blockReason = getAccountActionBlockReason(profile, blockAction);
      if (blockReason) {
        toast(blockReason, { variant: "warning" });
        return false;
      }

      action();
      return true;
    },
    [navigate, openVerifyEmailModal, profile, toast],
  );

  return { guardAction };
}
