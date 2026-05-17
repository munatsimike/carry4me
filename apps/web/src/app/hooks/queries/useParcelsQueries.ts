import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import {
  getParcelsUseCase,
  getParcelUseCase,
  myParcelsUseCase,
} from "@/app/lib/useCases";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";

export function useParcelsList(userId?: string) {
  return useQuery({
    queryKey: queryKeys.parcels.list(userId),
    queryFn: () => getParcelsUseCase.execute(userId),
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

export function useToggleParcelListLike(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.parcels.list(userId);

  return (listingId: string) => {
    queryClient.setQueryData<ParcelListing[]>(queryKey, (prev) =>
      (prev ?? []).map((item) =>
        item.id === listingId ? { ...item, isLiked: !item.isLiked } : item,
      ),
    );
  };
}
