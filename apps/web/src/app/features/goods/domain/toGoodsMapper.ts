import type { UserGoods } from "./UserGoods";

export default function toGoodsMapper(
  id: string,
  categoryId: string[],
): UserGoods {
  return {
    tripParcelId: id,
    categoryIds: categoryId,
  };
}
