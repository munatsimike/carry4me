import type { ParcelRepository } from "../domain/ParcelRepository";
import type { ParcelDto } from "./ParcelDto";

export class EditParcelUsecase {
  repo: ParcelRepository;

  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(editParcel: Partial<ParcelDto>): Promise<string> {
    return await this.repo.editParcel(editParcel);
  }
}
