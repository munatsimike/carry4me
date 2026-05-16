import type {
  Listing,
  ListingType,
} from "../../../shared/Authentication/domain/Listing";

export interface FavouriteRepository {
  fetchFavourites(userId: string): Promise<Listing[]>;

  addFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<string>;

  removeFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<string>;

  toggleFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<boolean>;
}
