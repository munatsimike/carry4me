import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { ParcelListingRepository } from "../domain/CreateParcelRepository";
import type { ParcelListing } from "../domain/Parcel";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class GetParcelsUseCase {
  repo: ParcelListingRepository;

  constructor(repo: ParcelListingRepository) {
    this.repo = repo;
  }

  async execute(userId?:string): Promise<Result<ParcelListing[]>> {
    const result = await this.repo.parcelsById(userId);
    return toResult(result);
  }
}
