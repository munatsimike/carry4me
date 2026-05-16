import type { GoodsCategory } from "./GoodsCategory";
import type { UserGoods } from "./UserGoods";
import type { EditGoodsDto } from "../application/EditGoodsDto";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";

export interface GoodsRepository {
  list(): Promise<GoodsCategory[]>;
  saveGoods(input: UserGoods, isTrip: boolean): Promise<string>;
  editListingGoods(
    type: ListingType,
    editGoods: EditGoodsDto[],
  ): Promise<string>;
}
