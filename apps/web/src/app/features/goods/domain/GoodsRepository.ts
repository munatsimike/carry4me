import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { GoodsCategory } from "./GoodsCategory";
import type { UserGoods } from "./UserGoods";
import type { EditGoodsDto } from "../application/EditGoodsDto";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";

export interface GoodsRepository {
  list(): Promise<RepoResponse<GoodsCategory[]>>;
  saveGoods(input: UserGoods, isTrip: boolean): Promise<RepoResponse<string>>;
  editListingGoods(type: ListingType, editGoods: EditGoodsDto[]): Promise<RepoResponse<string>>;
}
