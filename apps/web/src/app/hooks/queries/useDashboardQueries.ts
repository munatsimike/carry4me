import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import {
  getDashboardDataUseCase,
  getNotificationUseCase,
  getParcelsUseCase,
  getTripsUseCase,
  myParcelsUseCase,
  myTripsUseCase,
} from "@/app/lib/useCases";
import { buildDashboardSuggestedMatches } from "@/app/features/dashboard/application/suggestedMatches";

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

export function useDashboardSuggestedMatches(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.suggestedMatches(userId ?? ""),
    queryFn: async () => {
      const [activeParcels, activeTrips, allParcels, allTrips] =
        await Promise.all([
          myParcelsUseCase.execute(userId!),
          myTripsUseCase.execute(userId!),
          getParcelsUseCase.execute(userId!),
          getTripsUseCase.execute(userId!),
        ]);

      return buildDashboardSuggestedMatches({
        userId: userId!,
        activeParcels,
        activeTrips,
        allParcels,
        allTrips,
      });
    },
    enabled: !!userId,
    retry: 1,
  });
}
