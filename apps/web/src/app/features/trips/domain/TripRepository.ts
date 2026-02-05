import type { Trip } from "./Trip";
import type { CreateTrip } from "./CreateTrip";

export interface TripsRepository {
  createTrip(userId: string, input: CreateTrip): Promise<string>;
  listTrips(): Promise<Trip[]>;
  fetchTrip(userId: string): Promise<Trip | null>;
}
