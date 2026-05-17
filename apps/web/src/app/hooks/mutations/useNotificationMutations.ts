import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getNotificationUseCase } from "@/app/lib/useCases";

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => getNotificationUseCase.makeAllAsRead(userId),
    onSuccess: (_data, userId) => {
      queryClient.setQueryData(
        queryKeys.notifications.list(userId),
        (prev: Awaited<ReturnType<typeof getNotificationUseCase.execute>> | undefined) =>
          prev?.map((n) => ({ ...n, readAt: new Date().toISOString() })) ?? [],
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.detail(userId),
      });
    },
  });
}
