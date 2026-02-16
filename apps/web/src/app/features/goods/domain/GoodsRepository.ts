import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { GoodsCategory } from "./GoodsCategory";
import type { UserGoods } from "./UserGoods";

export interface GoodsRepository {
  list(): Promise<RepoResponse<GoodsCategory[]>>;
  getBySlug(slug: string): Promise<GoodsCategory | null>;
  saveGoods(input: UserGoods, isTrip: boolean): Promise<RepoResponse<string>>;
  update(id: string, input: { slug?: string; name?: string }): Promise<void>;
}
