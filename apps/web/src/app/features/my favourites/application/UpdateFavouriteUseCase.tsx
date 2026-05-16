import type { FavouriteRepository } from "../data/FavouritesRepository";
import type { FavouriteState } from "../domain/types";

export class UpadateFavouriteUseCase {
  repo: FavouriteRepository;

  constructor(repo: FavouriteRepository) {
    this.repo = repo;
  }

  async execute(state: FavouriteState): Promise<boolean> {
    return await this.repo.toggleFavourite(
      state.userId,
      state.listingId,
      state.listingType,
    );
  }
}
