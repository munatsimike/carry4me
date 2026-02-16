import type { Trip } from "./Trip";
import type { CreateTrip } from "./CreateTrip";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export interface TripsRepository {
  createTrip(userId: string, input: CreateTrip): Promise<RepoResponse<string>>;
  listTrips(): Promise<RepoResponse<Trip[]>>;
  fetchTrip(userId: string): Promise<RepoResponse<Trip>>;
}
