import { supabase } from "@/app/shared/supabase/client";
import type { GoodsCategory } from "../domain/GoodsCategory";
import type { GoodsCategoriesRepository } from "../domain/GoodsRepository";
import type { UserGoods } from "../domain/UserGoods";

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

  // what goods categories what senders are sending or what travelers are willing to carry
  async saveGoods(input: UserGoods): Promise<void> {
    const rows = input.categoryIds.map((item) => ({
      trip_id: input.tripParcelId,
      category_id: item,
    }));
    await supabase.from("trip_accepted_categories").insert(rows).throwOnError();
  }

  update(id: string, input: { slug?: string; name?: string }): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
