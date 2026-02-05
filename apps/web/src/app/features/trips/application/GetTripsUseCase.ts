import type { Trip } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";

export class GetTripsUseCase {
  private repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(): Promise<Trip[]> {
    const data = await this.repo.listTrips();
    return data;
  }
}
