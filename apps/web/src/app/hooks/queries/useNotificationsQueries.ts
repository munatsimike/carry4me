import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getNotificationUseCase } from "@/app/lib/useCases";

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.list(userId ?? ""),
    queryFn: () => getNotificationUseCase.execute(userId!),
    enabled: !!userId,
  });
}
