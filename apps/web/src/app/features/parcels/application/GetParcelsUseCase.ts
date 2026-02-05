import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { Parcel } from "../domain/Parcel";

export class GetParcelsUseCase {
  repo: ParcelRepository;

  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(): Promise<Parcel[]> {
    return this.repo.fetchParcels();
  }
}
