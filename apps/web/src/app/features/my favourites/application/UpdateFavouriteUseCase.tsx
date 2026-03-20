import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { FavouriteRepository } from "../data/FavouritesRepository";
import type { FavouriteState } from "../domain/types";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class UpadateFavouriteUseCase {
  repo: FavouriteRepository;

  constructor(repo: FavouriteRepository) {
    this.repo = repo;
  }

  async execute(state: FavouriteState): Promise<Result<boolean>> {
    const result = await this.repo.toggleFavourite(
      state.userId,
      state.listingId,
      state.listingType,
    );
    return toResult(result);
  }
}
