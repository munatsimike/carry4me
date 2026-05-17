import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getFavouritesUseCase } from "@/app/lib/useCases";

export function useFavourites(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.favourites.list(userId ?? ""),
    queryFn: () => getFavouritesUseCase.execute(userId!),
    enabled: !!userId,
  });
}
