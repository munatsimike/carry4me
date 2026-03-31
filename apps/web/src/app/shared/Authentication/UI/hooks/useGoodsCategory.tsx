import { useEffect, useMemo, useState } from "react";
import { namedCall } from "../../application/NamedCall";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import { useUniversalModal } from "../../application/DialogBoxModalProvider";
import { SupabaseGoodsRepository } from "@/app/features/goods/data/SupabaseGoodsRepository";
import { GetGoodsUseCase } from "@/app/features/goods/application/GetGoodsUseCase";


export default function useGoodsCategory() {
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const getGoodsUseCase = useMemo(
    () => new GetGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  const { showSupabaseError } = useUniversalModal();

  const [goodsCategory, setCategory] = useState<GoodsCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchGoods() {
      setIsLoading(true);

      const { result } = await namedCall("goods", getGoodsUseCase.execute());

      if (!result.success) {
        showSupabaseError(result.error);
        setIsLoading(false);
        return;
      }

      setCategory(result.data);
      setIsLoading(false);
    }

    fetchGoods();
  }, [getGoodsUseCase, showSupabaseError]);

  return { goodsCategory, isLoading };
}