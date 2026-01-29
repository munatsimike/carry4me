import type { UITrip } from "./UITrip";


export interface TripsRepository {
  createTrip(userId: string, input: UITrip): Promise<void>;
  // listTrips(filters): Promise<Trip[]>
}
