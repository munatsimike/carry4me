import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { Parcel } from "../domain/Parcel";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class GetParcelsUseCase {
  repo: ParcelRepository;

  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(): Promise<Result<Parcel[]>> {
    const result = await this.repo.fetchParcels()
    return toResult(result);
  }
}
