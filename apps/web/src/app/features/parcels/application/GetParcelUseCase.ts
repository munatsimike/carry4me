import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { ParcelRepository } from "../domain/ParcelRepository";
import type { ParcelListing } from "../domain/Parcel";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class GetParcelUseCase {
  repo: ParcelRepository;
  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<ParcelListing[]>> {
    const data = await this.repo.parcelsById(userId);
    return toResult(data);
  }
}
