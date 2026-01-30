import { supabase } from "@/app/shared/supabase/client";
import type { GoodsCategory } from "../domain/GoodsCategory";
import type { GoodsCategoriesRepository } from "../domain/GoodsRepository";

export class SupabaseGoodsRepository implements GoodsCategoriesRepository {
  async list(): Promise<GoodsCategory[]> {
    const { data } = await supabase
      .from("goods_categories")
      .select("id, slug, name")
      .throwOnError();
    return data ?? [];
  }

  getBySlug(slug: string): Promise<GoodsCategory | null> {
    throw new Error("Method not implemented.");
  }
  create(input: { slug: string; name: string }): Promise<GoodsCategory> {
    throw new Error("Method not implemented.");
  }
  update(id: string, input: { slug?: string; name?: string }): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
