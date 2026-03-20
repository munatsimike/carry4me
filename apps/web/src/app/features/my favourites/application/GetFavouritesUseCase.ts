import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { SupabaseFavouriteRepository } from "../data/SupabaseFavouriteRepository";
import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";

export class GetFavouritesUseCase {
  repo: SupabaseFavouriteRepository;

  constructor(repo: SupabaseFavouriteRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<Listing[]>> {
    const result = await this.repo.fetchFavourites(userId);
    return toResult(result);
  }
}
