import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { GoodsCategory } from "./GoodsCategory";
import type { UserGoods } from "./UserGoods";
import type { EditGoodsDto } from "../application/EditGoodsDto";

export interface GoodsRepository {
  list(): Promise<RepoResponse<GoodsCategory[]>>;
  getBySlug(slug: string): Promise<GoodsCategory | null>;
  saveGoods(input: UserGoods, isTrip: boolean): Promise<RepoResponse<string>>;
  editParcel(editGoods: EditGoodsDto[]): Promise<RepoResponse<string>>;
}
