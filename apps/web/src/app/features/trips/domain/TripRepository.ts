import type { Trip } from "./Trip";
import type { CreateTrip } from "./CreateTrip";

export interface TripsRepository {
  createTrip(userId: string, input: CreateTrip): Promise<void>;
  listTrips(): Promise<Trip[]>;
}
