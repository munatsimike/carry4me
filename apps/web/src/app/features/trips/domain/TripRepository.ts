import type { TripListing as TripListing } from "./Trip";
import type { CreateTripListing } from "./CreateTrip";
import type { TripDto } from "../application/TripDto";

export interface TripsRepository {
  createTrip(
    userId: string,
    input: CreateTripListing,
  ): Promise<string>;
  listTrips(userId?: string | null): Promise<TripListing[]>;
  tripsById(userId: string, tripId?: string): Promise<TripListing[]>;
  deleteTrip(parcelId: string): Promise<string>;
  editTrip(editTrip: Partial<TripDto>): Promise<string>;
}
