import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import { useGoodsCategories } from "@/app/hooks/queries/useGoodsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";

export default function useGoodsCategory() {
  const { data, isLoading, error } = useGoodsCategories();
  useQueryErrorEffect(error);

  const goodsCategory: GoodsCategory[] = data ?? [];

  return { goodsCategory, isLoading };
}
