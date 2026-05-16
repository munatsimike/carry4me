import type { TripsRepository } from "../domain/TripRepository";
import type { TripDto } from "./TripDto";

export class EditTripUsecase {
  repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(editParcel: Partial<TripDto>): Promise<string> {
    return await this.repo.editTrip(editParcel);
  }
}
