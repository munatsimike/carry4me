import { supabase } from "@/app/shared/supabase/client";
import type { GoodsCategory } from "../domain/GoodsCategory";
import type { GoodsRepository } from "../domain/GoodsRepository";
import type { UserGoods } from "../domain/UserGoods";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { EditGoodsDto } from "../application/EditGoodsDto";

export class SupabaseGoodsRepository implements GoodsRepository {
  async list(): Promise<RepoResponse<GoodsCategory[]>> {
    const { data, status, error } = await supabase
      .from("goods_categories")
      .select("id, slug, name");
    if (error) return { data: null, status, error };
    return { error: null, status: null, data };
  }

  getBySlug(slug: string): Promise<GoodsCategory | null> {
    throw new Error("Method not implemented.");
  }

  // what goods categories what senders are sending or what travelers are willing to carry
  async saveGoods(
    input: UserGoods,
    isTrip: boolean,
  ): Promise<RepoResponse<string>> {
    const foreignKey = isTrip ? "trip_id" : "parcel_id";
    const table = isTrip ? "trip_accepted_categories" : "parcel_categories";
    const rows = input.categoryIds.map((item) => ({
      [foreignKey]: input.tripParcelId,
      category_id: item,
    }));

    const { data, status, error } = await supabase.from(table).insert(rows);
    if (error) return { data: null, status, error };
    return { error: null, status: null, data };
  }

  async editParcel(editGoods: EditGoodsDto[]): Promise<RepoResponse<string>> {
    this.deleteParcel(editGoods[0].parcel_id);
    const { data, error } = await supabase
      .from("parcel_categories")
      .insert(editGoods)
      .select("parcel_id");
    if (error) return { error: null, status: null, data };
    return { error: null, status: null, data: data[0].parcel_id };
  }

  async deleteParcel(parcelId: string) {
    const del = await supabase
      .from("parcel_categories")
      .delete()
      .eq("parcel_id", parcelId);

    if (del.error) {
      return { data: null, error: del.error.message, status: del.status };
    }
  }
}
