import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { Trip } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class GetTripUseCase {
  repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<Trip>> {
    const result = await this.repo.fetchTrip(userId)
    return toResult(result)
  }
}
