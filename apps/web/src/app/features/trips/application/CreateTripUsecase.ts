import type {
  TripsRepository,
} from "../domain/TripRepository";
import type { UITrip } from "../domain/UITrip";

export class CreateTripUseCase {
  private repo: TripsRepository;
  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(userId: string, input: UITrip): Promise<void> {
    this.validate(input);
    await this.repo.createTrip(userId, input);
  }

  private validate(input: UITrip) {
    if (input.capacityKg <= 0) {
      throw new Error("Capacity should be greater than 0");
    }
  }
}
