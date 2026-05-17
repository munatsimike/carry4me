import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import {
  getTripsUseCase,
  getTripUseCase,
  myTripsUseCase,
} from "@/app/lib/useCases";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import type { ListingPageParams, PaginatedResult } from "@/types/Pagination";

export function useTripsList(userId: string | undefined, params: ListingPageParams) {
  return useQuery({
    queryKey: queryKeys.trips.browse(userId, params),
    queryFn: () => getTripsUseCase.executePaged(userId, params),
    placeholderData: keepPreviousData,
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

export function useToggleTripListLike(
  userId: string | undefined,
  params: ListingPageParams,
) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.trips.browse(userId, params);

  return (listingId: string) => {
    queryClient.setQueryData<PaginatedResult<TripListing>>(queryKey, (prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === listingId ? { ...item, isLiked: !item.isLiked } : item,
        ),
      };
    });
  };
}
