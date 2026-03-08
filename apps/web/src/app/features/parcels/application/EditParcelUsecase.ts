import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { ParcelListingRepository } from "../domain/CreateParcelRepository";
import type { ParcelDto } from "./ParcelDto";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class EditParcelUsecase {
  repo: ParcelListingRepository;

  constructor(repo: ParcelListingRepository) {
    this.repo = repo;
  }

  async execute(editParcel: Partial<ParcelDto>): Promise<Result<string>> {
    const result = await this.repo.editParcel(editParcel);
    return toResult(result);
  }
}
