import type { CreateTripInput, TripsRepository } from "../data/trip.repository";

export async function createTripUseCase(
  repo: TripsRepository,
  input: CreateTripInput,
) {
  if (input.capacityKg <= 0) throw new Error("Capacity must be > 0");
  // more rules...
  return repo.createTrip(input);
}
