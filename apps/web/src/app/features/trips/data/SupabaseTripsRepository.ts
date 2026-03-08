import { supabase } from "@/app/shared/supabase/client";
import type { TripsRepository } from "../domain/TripRepository";
import type { CreateTripListing } from "../domain/CreateTrip";
import type { TripListing } from "../domain/Trip";
import { mapTripRowToTrip } from "../domain/tripmappers";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import { deleteById } from "@/app/shared/Authentication/domain/SupabaseHelper";
import type { TripDto } from "../application/TripDto";

export class SupabaseTripsRepository implements TripsRepository {
  async editTrip(editTrip: Partial<TripDto>): Promise<RepoResponse<string>> {
    const { data, error } = await supabase
      .from("trips")
      .update(editTrip)
      .eq("id", editTrip.id)
      .select("id");
    if (error) {
      return { data: null, error: error, status: null };
    }
    return { data: data[0].id, error: null, status: null };
  }

  async deleteTrip(parcelId: string): Promise<RepoResponse<string>> {
    return deleteById(parcelId, "trips");
  }
  async tripById(userId: string): Promise<RepoResponse<TripListing[]>> {
    return this.listTrips(userId);
  }
  async fetchTrip(userId: string): Promise<RepoResponse<TripListing>> {
    const { data, error, status } = await supabase
      .from("trips")
      .select(
        `*,traveler:profiles(id,full_name,avatar_url),trip_accepted_categories(
        category:goods_categories(
          id,
          slug,
          name
        )
      )`,
      )
      .eq("traveler_user_id", userId)
      .maybeSingle();
    if (error) return { data: null, status, error };
    if (error) return { data: null, status: null, error: null };
    const result = data.mapTripRowToTrip(data);
    return { data: result, status, error: null };
  }

  async listTrips(userId?: string): Promise<RepoResponse<TripListing[]>> {
    let query = supabase.from("trips").select(`
      *,
      traveler:profiles(id, full_name, avatar_url),
      trip_accepted_categories(
        category:goods_categories(
          id,
          slug,
          name
        )
      )
    `);

    // Only filter if userId is provided
    if (userId) {
      query = query.eq("traveler_user_id", userId);
    }

    const { data, error, status } = await query;

    if (error) return { data: null, status, error };

    const result = data.map(mapTripRowToTrip);
    return { data: result, error: null, status };
  }

  async createTrip(
    userId: string,
    input: CreateTripListing,
  ): Promise<RepoResponse<string>> {
    const { data, error, status } = await supabase
      .from("trips")
      .insert({
        traveler_user_id: userId,
        origin_country: input.originCountry,
        origin_city: input.originCity,
        destination_country: input.destinationCountry,
        destination_city: input.destinationCity,
        depart_date: input.departureDate,
        arrive_date: input.arrivalDate ?? null,
        capacity_kg: input.capacityKg,
        price_per_kg: input.pricePerKg,
        status: "open",
      })
      .select("id")
      .single();

    if (error) return { data: null, status, error };
    return { data: data.id, status, error: null };
  }
}
