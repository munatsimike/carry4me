import { AppError } from "@/app/shared/domain/AppError";
import type { CreateTripListing } from "../domain/CreateTrip";
import type { TripsRepository } from "../domain/TripRepository";

export class CreateTripUseCase {
  private repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string, input: CreateTripListing): Promise<string> {
    this.validate(input);
    return await this.repo.createTrip(userId, input);
  }

  private validate(input: CreateTripListing) {
    if (input.capacityKg <= 0) {
      throw new AppError({
        message: "Capacity should be greater than 0",
        code: "VALIDATION_ERROR",
      });
    }
  }
}
