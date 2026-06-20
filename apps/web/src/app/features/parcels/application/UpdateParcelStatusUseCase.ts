import type { ParcelRepository } from "../domain/ParcelRepository";

export class UpdateParcelStatusUseCase {
  repo: ParcelRepository;

  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(parcelId: string, active: boolean): Promise<string> {
    return this.repo.setParcelListingActive(parcelId, active);
  }
}
