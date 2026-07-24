import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFavouriteUseCase } from "@/app/lib/useCases";
import { queryKeys } from "@/app/lib/queryKeys";
import type { FavouriteState } from "@/app/features/my favourites/domain/types";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

export function useToggleFavouriteMutation() {
  const { showSupabaseError } = useUniversalModal();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FavouriteState) => updateFavouriteUseCase.execute(input),
    onSuccess: (_data, variables) => {
      const { userId, listingType } = variables;
      const listingRootKey =
        listingType === "trip" ? queryKeys.trips.all : queryKeys.parcels.all;

      // Favourites removal must also clear hearts on browse / suggested matches.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.favourites.list(userId),
      });
      void queryClient.invalidateQueries({ queryKey: listingRootKey });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.suggestedMatches(userId),
      });
    },
    onError: (err) => showSupabaseError(err),
  });
}
