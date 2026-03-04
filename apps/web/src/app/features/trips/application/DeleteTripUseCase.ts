import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { TripsRepository } from "../domain/TripRepository";

export class DeleteTripUseCase {
  repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(parcelId: string): Promise<Result<string>> {
    const result = await this.repo.deleteTrip(parcelId);
    return toResult(result);
  }
}
