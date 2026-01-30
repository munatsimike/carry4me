import type { GoodsCategory } from "./GoodsCategory";

export interface GoodsCategoriesRepository {
  list(): Promise<GoodsCategory[]>;
  getBySlug(slug: string): Promise<GoodsCategory | null>;
  create(input: { slug: string; name: string }): Promise<GoodsCategory>;
  update(id: string, input: { slug?: string; name?: string }): Promise<void>;
}
