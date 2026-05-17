import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getGoodsUseCase } from "@/app/lib/useCases";

export function useGoodsCategories() {
  return useQuery({
    queryKey: queryKeys.goods.categories,
    queryFn: () => getGoodsUseCase.execute(),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
