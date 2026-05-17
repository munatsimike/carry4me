import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import {
  getTripsUseCase,
  getTripUseCase,
  myTripsUseCase,
} from "@/app/lib/useCases";
import type { TripListing } from "@/app/features/trips/domain/Trip";

export function useTripsList(userId?: string) {
  return useQuery({
    queryKey: queryKeys.trips.list(userId),
    queryFn: () => getTripsUseCase.execute(userId),
  });
}

export function useMyTrips(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.trips.mine(userId ?? ""),
    queryFn: () => myTripsUseCase.execute(userId!),
    enabled: !!userId,
  });
}

export function useUserTrips(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.trips.byUser(userId ?? ""),
    queryFn: () => getTripUseCase.execute(userId!),
    enabled: !!userId,
  });
}

export function useToggleTripListLike(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.trips.list(userId);

  return (listingId: string) => {
    queryClient.setQueryData<TripListing[]>(queryKey, (prev) =>
      (prev ?? []).map((item) =>
        item.id === listingId ? { ...item, isLiked: !item.isLiked } : item,
      ),
    );
  };
}
