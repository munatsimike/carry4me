import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import {
  getDashboardDataUseCase,
  getNotificationUseCase,
} from "@/app/lib/useCases";

export function useDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.detail(userId ?? ""),
    queryFn: async () => {
      const [dashboard, notifications] = await Promise.all([
        getDashboardDataUseCase.execute(userId!),
        getNotificationUseCase.execute(userId!),
      ]);
      return {
        dashboard,
        recentNotifications: notifications.slice(0, 4),
      };
    },
    enabled: !!userId,
  });
}
