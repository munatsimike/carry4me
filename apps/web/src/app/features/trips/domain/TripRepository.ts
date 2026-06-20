import type { TripListing as TripListing } from "./Trip";
import type { CreateTripListing } from "./CreateTrip";
import type { TripDto } from "../application/TripDto";
import type { ListingPageParams, PaginatedResult } from "@/types/Pagination";

export interface TripsRepository {
  createTrip(
    userId: string,
    input: CreateTripListing,
  ): Promise<string>;
  listTrips(
    userId?: string | null,
    params?: ListingPageParams,
  ): Promise<TripListing[] | PaginatedResult<TripListing>>;
  tripsById(userId: string, tripId?: string): Promise<TripListing[]>;
  deleteTrip(parcelId: string): Promise<string>;
  editTrip(editTrip: Partial<TripDto>): Promise<string>;
  setTripListingActive(tripId: string, active: boolean): Promise<string>;
}
