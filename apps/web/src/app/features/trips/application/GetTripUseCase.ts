import type { Trip } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";

export class GetTripUseCase {
  repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Trip | null> {
    return this.repo.fetchTrip(userId);
  }
}
