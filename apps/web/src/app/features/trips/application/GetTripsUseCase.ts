import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { TripListing } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class GetTripsUseCase {
  private repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId?: string): Promise<Result<TripListing[]>> {
    const data = await this.repo.listTrips(userId);
    return toResult(data);
  }
}
