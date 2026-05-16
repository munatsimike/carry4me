import type { ParcelListing } from "../domain/Parcel";
import type { ParcelRepository } from "../domain/ParcelRepository";

export class GetParcelUseCase {
  repo: ParcelRepository;
  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<ParcelListing[]> {
    return await this.repo.parcelsById(userId);
  }
}
