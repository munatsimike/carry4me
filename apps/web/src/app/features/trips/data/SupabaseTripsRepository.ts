import { supabase } from "@/app/shared/supabase/client";
import type {

  TripsRepository,
} from "../domain/TripRepository";
import type { UITrip } from "../domain/UITrip";

export class SupabaseTripsRepository implements TripsRepository {
  async createTrip(userId: string, input: UITrip) {
    await supabase
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
      .throwOnError();
  }
}