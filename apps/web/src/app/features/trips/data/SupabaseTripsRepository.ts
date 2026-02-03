import { supabase } from "@/app/shared/supabase/client";
import type { TripsRepository } from "../domain/TripRepository";
import type { CreateTrip } from "../domain/CreateTrip";
import type { Trip } from "../domain/Trip";
import { mapTripRowToTrip } from "../domain/tripmappers";

export class SupabaseTripsRepository implements TripsRepository {
  async listTrips(): Promise<Trip[]> {
    const { data } = await supabase
      .from("trips")
      .select(
        `
      *,
      traveler:profiles(full_name),
      trip_accepted_categories(
        category:goods_categories(
          id,
          slug,
          name
        )
      )
    `,
      )
      .throwOnError();

    return (data ?? []).map(mapTripRowToTrip);
  }
  async createTrip(userId: string, input: CreateTrip): Promise<string> {
    const { data } = await supabase
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
      .single()
      .throwOnError();
    return data.id;
  }
}
