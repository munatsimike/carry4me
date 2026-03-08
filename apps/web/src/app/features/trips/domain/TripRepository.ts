import type { TripListing as TripListing } from "./Trip";
import type { CreateTripListing } from "./CreateTrip";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export interface TripsRepository {
  createTrip(
    userId: string,
    input: CreateTripListing,
  ): Promise<RepoResponse<string>>;
  listTrips(userId?: string | null): Promise<RepoResponse<TripListing[]>>;
  fetchTrip(userId: string): Promise<RepoResponse<TripListing>>;
  tripById(userId: string): Promise<RepoResponse<TripListing[]>>;
  deleteTrip(parcelId: string): Promise<RepoResponse<string>>;
}
