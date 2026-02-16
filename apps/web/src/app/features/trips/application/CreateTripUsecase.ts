import type { TripsRepository } from "../domain/TripRepository";
import type { CreateTrip } from "../domain/CreateTrip";
import type { Result } from "@/app/shared/Authentication/domain/Result";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class CreateTripUseCase {
  private repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string, input: CreateTrip): Promise<Result<string>> {
    this.validate(input);
    const data = await this.repo.createTrip(userId, input);
    return toResult(data);
  }

  private validate(input: CreateTrip) {
    if (input.capacityKg <= 0) {
      throw new Error("Capacity should be greater than 0");
    }
  }
}
