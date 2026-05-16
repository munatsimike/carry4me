import type { TripListing } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";

export class MyTripsUseCase {
  repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string, tripId?: string): Promise<TripListing[]> {
    return await this.repo.tripsById(userId, tripId);
  }
}
