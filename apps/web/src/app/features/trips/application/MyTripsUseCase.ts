import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { TripsRepository } from "../domain/TripRepository";
import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { TripListing } from "../domain/Trip";

export class MyTripsUseCase {
  repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<TripListing[]>> {
    const result = await this.repo.tripById(userId);
    return toResult(result);
  }
}
