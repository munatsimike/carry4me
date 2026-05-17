import { useEffect, useRef } from "react";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

/** Shows the Supabase error modal once per distinct query error (matches prior try/catch UX). */
export function useQueryErrorEffect(error: unknown | null, enabled = true) {
  const { showSupabaseError } = useUniversalModal();
  const lastShownRef = useRef<unknown>(null);

  useEffect(() => {
    if (!enabled || !error) return;
    if (lastShownRef.current === error) return;
    lastShownRef.current = error;
    showSupabaseError(error);
  }, [error, enabled, showSupabaseError]);
}
