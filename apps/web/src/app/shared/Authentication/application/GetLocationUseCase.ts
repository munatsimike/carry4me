
import type { LocationRepository } from "../domain/LocationRepository";
import type { MyLocation } from "../domain/MyLocation";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

/**
 * Use case for fetching location data from the repository.
 * This isolates presentation/business logic from the repository implementation.
 */
export class GetLocationUseCase {
  repo: LocationRepository;

  constructor(repo: LocationRepository) {
    this.repo = repo;
  }

  /**
   * Retrieve all countries and map the repository response into a Result.
   */
  async getCountries(): Promise<Result<MyLocation[]>> {
    const countries = await this.repo.getLocations();
    return toResult(countries);
  }

}
