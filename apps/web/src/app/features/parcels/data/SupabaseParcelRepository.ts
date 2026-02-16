import { supabase } from "@/app/shared/supabase/client";
import type { CreateParcel } from "../domain/CreateParcel";
import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { Parcel } from "../domain/Parcel";
import { toParcelMapper } from "../domain/toParcelMapper";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export class SupabaseParcelRepository implements ParcelRepository {
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

  async fetchParcels(): Promise<RepoResponse<Parcel[]>> {
    const { data, error, status } = await supabase.from("parcels").select(
      `*, sender:profiles(id,full_name), parcel_categories(
      category:goods_categories(
      id,
      slug,
      name
      ))`,
    );

    if (error) {
      return { data: null, error, status };
    }
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
