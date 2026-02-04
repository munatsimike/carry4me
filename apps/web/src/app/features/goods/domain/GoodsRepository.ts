import type { GoodsCategory } from "./GoodsCategory";
import type { UserGoods } from "./UserGoods";

export interface GoodsRepository {
  list(): Promise<GoodsCategory[]>;
  getBySlug(slug: string): Promise<GoodsCategory | null>;
  saveGoods(input: UserGoods): Promise<void>;
  update(id: string, input: { slug?: string; name?: string }): Promise<void>;
}
