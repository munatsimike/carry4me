import type { TripListing as TripListing } from "./Trip";
import type { CreateTripListing } from "./CreateTrip";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { TripDto } from "../application/TripDto";

export interface TripsRepository {
  createTrip(
    userId: string,
    input: CreateTripListing,
  ): Promise<RepoResponse<string>>;
  listTrips(userId?: string | null): Promise<RepoResponse<TripListing[]>>;
  tripsById(userId: string): Promise<RepoResponse<TripListing[]>>;
  deleteTrip(parcelId: string): Promise<RepoResponse<string>>;
  editTrip(editTrip: Partial<TripDto>): Promise<RepoResponse<string>>;
}
