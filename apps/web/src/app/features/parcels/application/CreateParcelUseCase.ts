import type { SupabaseParcelRepository } from "../data/SupabaseCreateParcelRepository";
import type { CreateParcel } from "../domain/CreateParcel";

export class CreateParcelUseCase {
  repo: SupabaseParcelRepository;
  constructor(repo: SupabaseParcelRepository) {
    this.repo = repo;
  }

  async execute(parcel: CreateParcel): Promise<string> {
    return this.repo.createParcel(parcel);
  }
}
