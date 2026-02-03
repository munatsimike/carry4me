import type { TripsRepository } from "../domain/TripRepository";
import type { CreateTrip } from "../domain/CreateTrip";

export class CreateTripUseCase {
  private repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string, input: CreateTrip): Promise<string> {
    this.validate(input);
   return this.repo.createTrip(userId, input);
  }

  private validate(input: CreateTrip) {
    if (input.capacityKg <= 0) {
      throw new Error("Capacity should be greater than 0");
    }
  }
}
