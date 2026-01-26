import { useEffect, useState } from "react";
import { getUserId } from "./Authentication";
import { supabase } from "./client";

export function useAuthState() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      const id = await getUserId();
      if (!mounted) return;
      setUserId(id);
      setAuthChecked(true);
    }

    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    authChecked,
    userId,
    userLoggedIn: Boolean(userId),
  };
}
