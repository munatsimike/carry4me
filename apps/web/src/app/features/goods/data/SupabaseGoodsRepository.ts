import { supabase } from "@/app/shared/supabase/client";
import type { GoodsCategory } from "../domain/GoodsCategory";
import type { GoodsRepository } from "../domain/GoodsRepository";
import type { UserGoods } from "../domain/UserGoods";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { EditGoodsDto } from "../application/EditGoodsDto";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";

export class SupabaseGoodsRepository implements GoodsRepository {
  async list(): Promise<RepoResponse<GoodsCategory[]>> {
    const { data, status, error } = await supabase
      .from("goods_categories")
      .select("id, slug, name");
    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          status: status,
          message: error.message,
        },
      };
    return { error: null, data };
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
    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          status: status,
          message: error.message,
        },
      };
    return { error: null, data };
  }

  async editListingGoods(
    type: ListingType,
    editGoods: EditGoodsDto[],
  ): Promise<RepoResponse<string>> {
    if (editGoods.length === 0) {
      return {
        data: null,
        error: {
          message: "No goods categories provided",
          status: 400,
        },
      };
    }

    const isTrip = type === "trip";
    const table = isTrip ? "trip_accepted_categories" : "parcel_categories";
    const idColumnName = isTrip ? "trip_id" : "parcel_id";

    const listingId = isTrip ? editGoods[0].trip_id : editGoods[0].parcel_id;

    if (!listingId) {
      return {
        data: null,
        error: {
          message: "No goods categories provided",
          status: 400,
        },
      };
    }
    const { error: deleteResult } = await this.deleteListingGoods(
      table,
      idColumnName,
      listingId,
    );

    if (deleteResult) {
      return {
        data: null,
        error: deleteResult,
      };
    }

    const rows = isTrip
      ? editGoods.map((item) => ({
          trip_id: item.trip_id!,
          category_id: item.category_id,
        }))
      : editGoods.map((item) => ({
          parcel_id: item.parcel_id!,
          category_id: item.category_id,
        }));

    const { error, status } = await supabase.from(table).insert(rows);

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    }

    return {
      data: listingId,
      error: null,
    };
  }

  async deleteListingGoods(
    tableName: string,
    idColumnName: string,
    listingId: string,
  ): Promise<RepoResponse<null>> {
    const { error, status } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumnName, listingId);

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    }

    return {
      data: null,
      error: null,
    };
  }
}
