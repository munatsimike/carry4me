import type { Listing, ListingType } from "../../../shared/Authentication/domain/Listing";
import type { RepoResponse } from "../../../shared/domain/RepoResponse";

export interface FavouriteRepository {
  fetchFavourites(userId: string): Promise<RepoResponse<Listing[]>>;

  addFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<RepoResponse<string>>;

  removeFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<RepoResponse<string>>;

  toggleFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<RepoResponse<boolean>>;
}