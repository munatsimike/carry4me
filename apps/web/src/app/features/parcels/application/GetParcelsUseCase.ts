import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { ParcelRepository } from "../domain/ParcelRepository";
import type { ParcelListing } from "../domain/Parcel";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class GetParcelsUseCase {
  repo: ParcelRepository;

  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId?: string): Promise<Result<ParcelListing[]>> {
    const result = await this.repo.fetchParcels(userId);
    return toResult(result);
  }
}
