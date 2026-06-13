import { requireData, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type { FavouriteRepository } from "./FavouritesRepository";
import type {
  Listing,
  ListingType,
} from "@/app/shared/Authentication/domain/Listing";
import { supabase } from "@/app/shared/supabase/client";
import {
  getFavListingIds,
  getParcelsByIds,
  getTripsByIds,
} from "@/app/shared/Authentication/domain/SupabaseHelper";

export class SupabaseFavouriteRepository implements FavouriteRepository {
  async fetchFavourites(userId: string): Promise<Listing[]> {
    const tripIds = await getFavListingIds(userId, "trip_id");
    const parcelIds = await getFavListingIds(userId, "parcel_id");

    const tripsResult = await getTripsByIds(tripIds, new Set(tripIds));
    const parcelsResult = await getParcelsByIds(parcelIds, new Set(parcelIds));

    return [...tripsResult, ...parcelsResult];
  }

  async addFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<string> {
    const payload =
      listingType === "trip"
        ? { user_id: userId, trip_id: listingId }
        : { user_id: userId, parcel_id: listingId };

    const { data, error, status } = await supabase
      .from("favourites")
      .insert(payload as any)
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  async removeFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<string> {
    const column = listingType === "trip" ? "trip_id" : "parcel_id";

    const { data, error, status } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId)
      .eq(column, listingId)
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  async toggleFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<boolean> {
    const column = listingType === "trip" ? "trip_id" : "parcel_id";
    const {
      data: existing,
      error: fetchError,
      status,
    } = await supabase
      .from("favourites")
      .select("id")
      .eq("user_id", userId)
      .eq(column, listingId)
      .maybeSingle();

    throwIfSupabaseError(fetchError, status);

    if (existing) {
      await this.removeFavourite(userId, listingId, listingType);
      return false;
    }

    await this.addFavourite(userId, listingId, listingType);
    return true;
  }
}
