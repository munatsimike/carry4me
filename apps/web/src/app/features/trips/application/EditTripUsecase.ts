import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { TripDto } from "./TripDto";
import type { TripsRepository } from "../domain/TripRepository";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class EditTripUsecase {
  repo: TripsRepository;

  constructor(repo: TripsRepository) {
    this.repo = repo;
  }

  async execute(editParcel: Partial<TripDto>): Promise<Result<string>> {
    const result = await this.repo.editTrip(editParcel);
    return toResult(result);
  }
}
