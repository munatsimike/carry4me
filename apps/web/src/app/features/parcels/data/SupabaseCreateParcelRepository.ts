import { supabase } from "@/app/shared/supabase/client";
import type { CreateParcel } from "../domain/CreateParcel";
import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { Parcel } from "../domain/Parcel";
import { toParcelMapper } from "../domain/toParcelMapper";

export class SupabaseParcelRepository implements ParcelRepository {
  async fetchParcel(userId: string): Promise<Parcel | null> {
    const { data } = await supabase
      .from("parcels")
      .select("*, sender:profiles(id,full_name, avatar_url")
      .eq("user_id", userId)
      .single()
      .throwOnError();
    if (!data) return null;
    return toParcelMapper(data);
  }
  async fetchParcels(): Promise<Parcel[]> {
    const { data } = await supabase
      .from("parcels")
      .select(
        `*, sender:profiles(id,full_name,avatar_url), parcel_categories(
      categories:goods_categories(
      id,
      slug,
      name
      ))`,
      )
      .throwOnError();
    return (data ?? []).map(toParcelMapper);
  }
  async createParcel(parcel: CreateParcel): Promise<string> {
    const { data } = await supabase
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
      .single()
      .throwOnError();
    return data.id;
  }
}
