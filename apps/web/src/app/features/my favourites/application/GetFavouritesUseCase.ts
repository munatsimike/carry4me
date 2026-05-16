import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import type { SupabaseFavouriteRepository } from "../data/SupabaseFavouriteRepository";

export class GetFavouritesUseCase {
  repo: SupabaseFavouriteRepository;

  constructor(repo: SupabaseFavouriteRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Listing[]> {
    return await this.repo.fetchFavourites(userId);
  }
}
