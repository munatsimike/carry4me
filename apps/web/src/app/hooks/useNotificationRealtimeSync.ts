import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { supabase } from "@/app/shared/supabase/client";

export function useNotificationRealtimeSync(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notification-sync-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.list(userId),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}
