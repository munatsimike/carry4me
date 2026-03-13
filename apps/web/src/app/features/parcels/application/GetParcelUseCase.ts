import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { ParcelListingRepository } from "../domain/CreateParcelRepository";
import type { ParcelListing } from "../domain/Parcel";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class GetParcelUseCase {
  repo: ParcelListingRepository;
  constructor(repo: ParcelListingRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<ParcelListing[]>> {
    const data = await this.repo.parcelsById(userId);
    return toResult(data);
  }
}
