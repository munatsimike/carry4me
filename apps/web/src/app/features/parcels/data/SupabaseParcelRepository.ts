import { supabase } from "@/app/shared/supabase/client";
import type { CreateParcel } from "../domain/CreateParcel";
import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { Parcel } from "../domain/Parcel";
import { toParcelMapper } from "../domain/toParcelMapper";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import { deleteById } from "@/app/shared/Authentication/domain/SupabaseHelper";

export class SupabaseParcelRepository implements ParcelRepository {
  async deleteParcel(parcelId: string): Promise<RepoResponse<string>> {
    return deleteById(parcelId, "parcels")
  }
  
  parcelById(userId: string): Promise<RepoResponse<Parcel[]>> {
    return this.fetchParcels(userId);
  }
  async fetchParcel(userId: string): Promise<RepoResponse<Parcel>> {
    const { data, error, status } = await supabase
      .from("parcels")
      .select(
        `*, sender:profiles(id,full_name), parcel_categories(
      category:goods_categories(
      id,
      slug,
      name
      ))`,
      )
      .eq("sender_user_id", userId)
      .maybeSingle();

    if (error) {
      return { data: null, error, status };
    }

    const parcel = toParcelMapper(data);
    return { error: null, data: parcel, status };
  }

  async fetchParcels(userId?: string): Promise<RepoResponse<Parcel[]>> {
    const query = supabase.from("parcels").select(
      `*, sender:profiles(id,full_name,avatar_url), parcel_categories(
      category:goods_categories(
      id,
      slug,
      name
      ))`,
    );

    if (userId) {
      query.eq("sender_user_id", userId);
    }
    const { data, error, status } = await query;
    if (error) {
      return { data: null, error, status };
    }
    if (!data) return { data: [], status: status, error: null };
    const parcelList = (data ?? []).map(toParcelMapper);
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
        status: "open",
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



