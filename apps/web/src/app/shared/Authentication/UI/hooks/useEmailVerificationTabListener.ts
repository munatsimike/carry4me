import { subscribeToEmailVerifiedEvents } from "@/app/shared/Authentication/application/emailVerificationTabCoordination";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useEffect } from "react";

export function useEmailVerificationTabListener() {
  const { refreshProfile } = useAuth();

  useEffect(() => {
    return subscribeToEmailVerifiedEvents(() => {
      void refreshProfile();
    });
  }, [refreshProfile]);
}
