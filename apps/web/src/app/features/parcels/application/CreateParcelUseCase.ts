import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { SupabaseParcelRepository } from "../data/SupabaseParcelRepository";
import type { CreateParcel } from "../domain/CreateParcel";
import type { Result } from "@/app/shared/Authentication/domain/Result";

export class CreateParcelUseCase {
  repo: SupabaseParcelRepository;
  constructor(repo: SupabaseParcelRepository) {
    this.repo = repo;
  }

  async execute(parcel: CreateParcel): Promise<Result<string>> {
    const result = await this.repo.createParcel(parcel);
   return toResult(result)
  }
}
