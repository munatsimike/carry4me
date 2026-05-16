import type { TripListing } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";

export class GetTripUseCase {
  repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<TripListing[]> {
    return await this.repo.tripsById(userId);
  }
}
