import type { ParcelRepository } from "../domain/ParcelRepository";

export class DeleteParcelUseCase {
  repo: ParcelRepository;

  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(parcelId: string): Promise<string> {
    return await this.repo.deleteParcel(parcelId);
  }
}
