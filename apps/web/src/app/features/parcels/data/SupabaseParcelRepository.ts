import { supabase } from "@/app/shared/supabase/client";
import type { CreateParcel } from "../domain/CreateParcel";
import type { ParcelRepository as ParcelRepository } from "../domain/ParcelRepository";
import { PARCELSTATUSES, type ParcelListing } from "../domain/Parcel";
import { toParcelMapper } from "../domain/toParcelMapper";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import {
  deleteById,
  getFavListingIds,
} from "@/app/shared/Authentication/domain/SupabaseHelper";
import type { ParcelDto } from "../application/ParcelDto";

export class SupabaseParcelRepository implements ParcelRepository {
  async deleteParcel(parcelId: string): Promise<RepoResponse<string>> {
    return deleteById(parcelId, "parcels");
  }

  async editParcel(
    editParcel: Partial<ParcelDto>,
  ): Promise<RepoResponse<string>> {
    const { data, error } = await supabase
      .from("parcels")
      .update(editParcel)
      .eq("id", editParcel.id)
      .select("id")
      .single();
    if (error) {
      return { data: null, error: error, status: null };
    }
    return { data: data.id, error: null, status: null };
  }

  async isParcelOpen(parcelId: string): Promise<RepoResponse<boolean>> {
    const { data, error, status } = await supabase
      .from("parcels")
      .select("id")
      .eq("id", parcelId)
      .eq("status", PARCELSTATUSES.OPEN)
      .maybeSingle();

    if (error) {
      return { data: null, error, status };
    }

    return { data: !!data, error: null, status };
  }

  parcelsById(
    userId: string,
  ): Promise<RepoResponse<ParcelListing[]>> {
    return this.fetchParcels(userId, true);
  }

  async fetchParcels(
    userId?: string,
    shouldFilter: boolean = false,
  ): Promise<RepoResponse<ParcelListing[]>> {
    const query = supabase.from("parcels").select(
      `*, sender:profiles(id,full_name,avatar_url), parcel_categories(
      category:goods_categories(
      id,
      slug,
      name
      ))`,
    );

    if (shouldFilter && userId) {
      query.eq("sender_user_id", userId);
    }
    query.eq("status", PARCELSTATUSES.OPEN);

    const { data, error, status } = await query;

    if (error) {
      return { data: null, error, status };
    }
    if (!data) return { data: [], status: status, error: null };

    const favParcelIds = await getFavListingIds(userId ?? "", "parcel_id");
    const favParcelIdSet = new Set(favParcelIds ?? []);
    const parcelList = data.map((row) => toParcelMapper(row, favParcelIdSet));

    return { data: parcelList, status: status, error: null };
  }

  async createParcel(parcel: CreateParcel): Promise<RepoResponse<string>> {
    const { data, error, status } = await supabase
      .from("parcels")
      .insert({
        sender_user_id: parcel.senderUserId,
        origin_country: parcel.originCountry,
        origin_city: parcel.originCity,
        destination_country: parcel.destinationCountry,
        destination_city: parcel.destinationCity,
        weight_kg: parcel.weightKg,
        price: parcel.price,
        status: parcel.status,
        items: parcel.items,
      })
      .select("id")
      .single();

    if (error) {
      return { data: null, error, status };
    }
    return { data: data.id, error: null, status: status };
  }
}
