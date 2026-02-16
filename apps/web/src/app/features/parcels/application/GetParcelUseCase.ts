import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { ParcelRepository } from "../domain/CreateParcelRepository";
import type { Parcel } from "../domain/Parcel";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class GetParcelUseCase {
  repo: ParcelRepository;
  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<Parcel>>{
    const data = await this.repo.fetchParcel(userId)
    return toResult(data)
  }
}
