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
      queryClient.invalidateQueries({
        queryKey: queryKeys.favourites.list(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.parcels.all });
    },
    onError: (err) => showSupabaseError(err),
  });
}
