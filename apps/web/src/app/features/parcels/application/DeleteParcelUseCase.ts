import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { ParcelListingRepository } from "../domain/CreateParcelRepository";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class DeleteParcelUseCase {
  repo: ParcelListingRepository;

  constructor(repo: ParcelListingRepository) {
    this.repo = repo;
  }

  async execute(parcelId: string): Promise<Result<string>> {
    const result = await this.repo.deleteParcel(parcelId);
    return toResult(result);
  }
}
