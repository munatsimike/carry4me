import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import {
  getParcelsUseCase,
  getParcelUseCase,
  myParcelsUseCase,
} from "@/app/lib/useCases";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { ListingPageParams, PaginatedResult } from "@/types/Pagination";

export function useParcelsList(
  userId: string | undefined,
  params: ListingPageParams,
) {
  return useQuery({
    queryKey: queryKeys.parcels.browse(userId, params),
    queryFn: () => getParcelsUseCase.executePaged(userId, params),
    placeholderData: keepPreviousData,
  });
}

export function useMyParcels(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.parcels.mine(userId ?? ""),
    queryFn: () => myParcelsUseCase.execute(userId!),
    enabled: !!userId,
  });
}

export function useUserParcels(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.parcels.byUser(userId ?? ""),
    queryFn: () => getParcelUseCase.execute(userId!),
    enabled: !!userId,
  });
}

export function useToggleParcelListLike(
  userId: string | undefined,
  params: ListingPageParams,
) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.parcels.browse(userId, params);

  return (listingId: string) => {
    queryClient.setQueryData<PaginatedResult<ParcelListing>>(
      queryKey,
      (prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === listingId ? { ...item, isLiked: !item.isLiked } : item,
          ),
        };
      },
    );
  };
}
