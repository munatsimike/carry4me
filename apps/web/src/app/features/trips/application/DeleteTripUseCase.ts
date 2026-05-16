import type { TripsRepository } from "../domain/TripRepository";

export class DeleteTripUseCase {
  repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(parcelId: string): Promise<string> {
    return await this.repo.deleteTrip(parcelId);
  }
}
