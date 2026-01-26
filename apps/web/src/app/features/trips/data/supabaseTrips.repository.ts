import { supabase } from "@/app/shared/supabase/client";
import type { Trip } from "../domain/trip.type";
import type { CreateTripInput, TripsRepository } from "./trip.repository";
import { mapTripRowToTrip } from "../domain/tripmappers";

export class SupabaseTripsRepository implements TripsRepository {
  async createTrip(input: CreateTripInput): Promise<Trip> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error("Not signed in");

    const res = await supabase
      .from("trips")
      .insert({
        traveler_user_id: authData.user.id,
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
      .select("*")
      .single();

    if (res.error) throw res.error;

    return mapTripRowToTrip(res.data);
  }
}
