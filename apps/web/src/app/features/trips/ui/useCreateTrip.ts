// features/trips/ui/useCreateTrip.ts
import { SupabaseTripsRepository } from "../data/supabaseTrips.repository";
import { createTripUseCase } from "../application/createTrip.usecase";

const repo = new SupabaseTripsRepository();

export function useCreateTrip() {
  async function createTrip(input: any) {
    return createTripUseCase(repo, input);
  }
  return { createTrip };
}
