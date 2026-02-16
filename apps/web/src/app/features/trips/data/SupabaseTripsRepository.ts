import { supabase } from "@/app/shared/supabase/client";
import type { TripsRepository } from "../domain/TripRepository";
import type { CreateTrip } from "../domain/CreateTrip";
import type { Trip } from "../domain/Trip";
import { mapTripRowToTrip } from "../domain/tripmappers";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export class SupabaseTripsRepository implements TripsRepository {
  async fetchTrip(userId: string): Promise<RepoResponse<Trip>> {
    const { data, error, status } = await supabase
      .from("trips")
      .select(
        `*,traveler:profiles(id,full_name),trip_accepted_categories(
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

  async listTrips(): Promise<RepoResponse<Trip[]>> {
    const { data, error, status } = await supabase.from("trips").select(
      `
      *,
      traveler:profiles(id,full_name),
      trip_accepted_categories(
        category:goods_categories(
          id,
          slug,
          name
        )
      )
    `,
    );

    if (error) return { data: null, status, error };
    if (error) return { data: null, status: null, error: null };
    const result = data.map(mapTripRowToTrip);
    return { data: result, error:null, status };
  }

  async createTrip(
    userId: string,
    input: CreateTrip,
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
    return { data: data.id, status, error:null };
  }
}
