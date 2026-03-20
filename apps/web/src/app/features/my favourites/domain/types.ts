import type { ListingType } from "@/app/shared/Authentication/domain/Listing";

export type FavouriteState = {
  userId: string;
  listingId: string;
  listingType: ListingType;
};
