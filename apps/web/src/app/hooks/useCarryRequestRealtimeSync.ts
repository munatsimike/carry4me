import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { supabase } from "@/app/shared/supabase/client";

type CarryRequestRealtimeRow = {
  sender_user_id?: string;
  traveler_user_id?: string;
};

export function useCarryRequestRealtimeSync(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`carry-request-sync-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carry_requests" },
        (payload) => {
          const row = payload.new as CarryRequestRealtimeRow | null;
          if (
            row?.sender_user_id !== userId &&
            row?.traveler_user_id !== userId
          ) {
            return;
          }

          void queryClient.invalidateQueries({
            queryKey: queryKeys.carryRequests.all,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}
