import { supabase } from "@/app/shared/supabase/client";
import { AppError, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type { GoodsCategory } from "../domain/GoodsCategory";
import type { GoodsRepository } from "../domain/GoodsRepository";
import type { UserGoods } from "../domain/UserGoods";
import type { EditGoodsDto } from "../application/EditGoodsDto";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";

export class SupabaseGoodsRepository implements GoodsRepository {
  async list(): Promise<GoodsCategory[]> {
    const { data, status, error } = await supabase
      .from("goods_categories")
      .select("id, slug, name");

    throwIfSupabaseError(error, status);

    return data ?? [];
  }

  async saveGoods(input: UserGoods, isTrip: boolean): Promise<string> {
    const foreignKey = isTrip ? "trip_id" : "parcel_id";
    const table = isTrip ? "trip_accepted_categories" : "parcel_categories";
    const rows = input.categoryIds.map((item) => ({
      [foreignKey]: input.tripParcelId,
      category_id: item,
    }));

    const { error, status } = await supabase.from(table).insert(rows as any);

    throwIfSupabaseError(error, status);

    return input.tripParcelId;
  }

  async editListingGoods(
    type: ListingType,
    editGoods: EditGoodsDto[],
  ): Promise<string> {
    if (editGoods.length === 0) {
      throw new AppError({
        message: "No goods categories provided",
        status: 400,
      });
    }

    const isTrip = type === "trip";
    const table = isTrip ? "trip_accepted_categories" : "parcel_categories";
    const idColumnName = isTrip ? "trip_id" : "parcel_id";

    const listingId = isTrip ? editGoods[0].trip_id : editGoods[0].parcel_id;

    if (!listingId) {
      throw new AppError({
        message: "No goods categories provided",
        status: 400,
      });
    }

    await this.deleteListingGoods(table, idColumnName, listingId);

    const rows = isTrip
      ? editGoods.map((item) => ({
          trip_id: item.trip_id!,
          category_id: item.category_id,
        }))
      : editGoods.map((item) => ({
          parcel_id: item.parcel_id!,
          category_id: item.category_id,
        }));

    const { error, status } = await supabase.from(table).insert(rows as any);

    throwIfSupabaseError(error, status);

    return listingId;
  }

  private async deleteListingGoods(
    tableName: string,
    idColumnName: string,
    listingId: string,
  ): Promise<void> {
    const { error, status } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumnName, listingId);

    throwIfSupabaseError(error, status);
  }
}
