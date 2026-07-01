import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/app/components/Toast";
import {
  getTravelerStripeReturnToast,
  syncTravelerStripeConnectAfterReturn,
} from "@/app/features/carry request/application/travelerStripeVerification";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { useAuth } from "@/app/shared/supabase/AuthProvider";

/**
 * Syncs Stripe Connect status after hosted onboarding redirects back (?stripe=return|refresh).
 * Runs on any authenticated route so dashboard/trip flows are covered.
 */
export function useStripeConnectReturnSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { showSupabaseError } = useUniversalModal();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam !== "return" && stripeParam !== "refresh") return;
    if (!user) return;

    const handleKey = `${stripeParam}:${searchParams.toString()}`;
    if (handledRef.current === handleKey) return;
    handledRef.current = handleKey;

    void (async () => {
      try {
        const origin = window.location.origin;
        const path = window.location.pathname;
        const status = await syncTravelerStripeConnectAfterReturn({
          returnUrl: `${origin}${path}?stripe=return`,
          refreshUrl: `${origin}${path}?stripe=refresh`,
        });
        await refreshProfile({ silent: true });
        const { message, variant } = getTravelerStripeReturnToast(status);
        toast(message, { variant });
      } catch (err) {
        showSupabaseError(err);
      } finally {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("stripe");
        const nextSearch = params.toString();
        setSearchParams(nextSearch ? `?${nextSearch}` : "", { replace: true });
      }
    })();
  }, [searchParams, user, refreshProfile, setSearchParams, showSupabaseError, toast]);
}
