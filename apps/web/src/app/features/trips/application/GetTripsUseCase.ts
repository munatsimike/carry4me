import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { Trip } from "../domain/Trip";
import type { TripsRepository } from "../domain/TripRepository";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class GetTripsUseCase {
  private repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(): Promise<Result<Trip[]>> {
    const data = await this.repo.listTrips();
    return toResult(data)
  }
}
