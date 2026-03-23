import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
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
  async fetchFavourites(userId: string): Promise<RepoResponse<Listing[]>> {
    const tripIds = await getFavListingIds(userId, "trip_id");
    const parcelIds = await getFavListingIds(userId, "parcel_id");

    if (!tripIds || !parcelIds) {
      return {
        data: null,
        error: { message: "unable to fetch favourites", code: "" },
      };
    }

    const { data: tripsResult, error: tripsError } = await getTripsByIds(
      tripIds,
      new Set(tripIds),
    );

    const { data: parcelsResult, error: parcelsError } = await getParcelsByIds(
      parcelIds,
      new Set(parcelIds),
    );

    if (tripsError || parcelsError || !tripsResult || !parcelsResult) {
      return {
        data: null,
        error: { message: "failed to fetch listings", code: "" },
      };
    }

    return {
      data: [...tripsResult, ...parcelsResult],
      error: null,
    };
  }

  async addFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<RepoResponse<string>> {
    const payload =
      listingType === "trip"
        ? { user_id: userId, trip_id: listingId }
        : { user_id: userId, parcel_id: listingId };

    const { data, error, status } = await supabase
      .from("favourites")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, status: status, code: error.code },
      };
    }

    return {
      data: data.id,
      error: null,
    };
  }

  async removeFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<RepoResponse<string>> {
    const column = listingType === "trip" ? "trip_id" : "parcel_id";

    const { data, error, status } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId)
      .eq(column, listingId)
      .select("id")
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, status: status, code: error.code },
      };
    }

    return {
      data: data.id,
      error: null,
    };
  }

  async toggleFavourite(
    userId: string,
    listingId: string,
    listingType: ListingType,
  ): Promise<RepoResponse<boolean>> {
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

    if (fetchError) {
      return {
        data: null,
        error: {
          message: fetchError.message,
          status: status,
          code: fetchError.code,
        },
      };
    }

    if (existing) {
      const { error: removeResult } = await this.removeFavourite(
        userId,
        listingId,
        listingType,
      );

      if (removeResult) {
        return {
          data: null,
          error: {
            message: removeResult.message,
            code: removeResult.code,
            status: removeResult.status,
          },
        };
      }

      return {
        data: false,
        error: null,
      };
    }

    const { error: addResult } = await this.addFavourite(
      userId,
      listingId,
      listingType,
    );

    if (addResult) {
      return {
        data: null,
        error: {
          message: addResult.message,
          status: addResult.status,
          code: addResult.code,
        },
      };
    }

    return {
      data: true,
      error: null,
    };
  }
}
