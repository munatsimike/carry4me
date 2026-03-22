import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { ParcelRepository } from "../domain/ParcelRepository";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { ParcelListing } from "../domain/Parcel";

export class MyParcelsIdUseCase {
  repo: ParcelRepository;
  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<ParcelListing[]>> {
    const result = await this.repo.parcelsById(userId);
    return toResult(result);
  }
}
