import type { TripListing } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";
import type { ListingPageParams, PaginatedResult } from "@/types/Pagination";

export class GetTripsUseCase {
  private repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId?: string): Promise<TripListing[]> {
    return (await this.repo.listTrips(userId)) as TripListing[];
  }

  async executePaged(
    userId: string | undefined,
    params: ListingPageParams,
  ): Promise<PaginatedResult<TripListing>> {
    return (await this.repo.listTrips(
      userId,
      params,
    )) as PaginatedResult<TripListing>;
  }
}
