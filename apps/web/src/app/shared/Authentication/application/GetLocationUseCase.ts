import type { LocationRepository } from "../domain/LocationRepository";
import type { MyLocation } from "../domain/MyLocation";

/**
 * Use case for fetching location data from the repository.
 * This isolates presentation/business logic from the repository implementation.
 */
export class GetLocationUseCase {
  repo: LocationRepository;

  constructor(repo: LocationRepository) {
    this.repo = repo;
  }

  async getCountries(): Promise<MyLocation[]> {
    return await this.repo.getLocations();
  }
}
