import type { TripsRepository } from "../domain/TripRepository";

export class UpdateTripStatusUseCase {
  repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(tripId: string, active: boolean): Promise<string> {
    return this.repo.setTripListingActive(tripId, active);
  }
}
