import type { TripListing } from "@/app/features/trips/domain/Trip";
import type { RepoResponse } from "../../domain/RepoResponse";
import { supabase } from "../../supabase/client";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import { mapTripRowToTrip } from "@/app/features/trips/domain/tripmappers";
import { toParcelMapper } from "@/app/features/parcels/domain/toParcelMapper";

export type Table = "parcels" | "trips";

export async function deleteById(
  listingId: string,
  table: Table,
): Promise<RepoResponse<string>> {
  const { data, error, status } = await supabase
    .from(table)
    .delete()
    .eq("id", listingId)
    .select("id");

  if (error) {
    return {
      data: null,
      error: {
        code: error.code,
        message: error.message,
        status: status,
      },
    };
  }

  if (!data || data.length === 0) {
    return {
      data: null,
      error: { code: "", message: "Parcel not found or not authorized." },
    };
  }

  return {
    data: listingId,
    error: null,
  };
}

export async function getFavItem(
  userId: string,
  column: "trip_id" | "parcel_id",
): Promise<RepoResponse<any[]>> {
  const { data, error, status } = await supabase
    .from("favourites")
    .select(`${column}, created_at`)
    .eq("user_id", userId)
    .not(column, "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: {
        code: error.code,
        message: error.message,
        status: status,
      },
    };
  }

  return { data, error: null };
}

export async function getTripsByIds(
  tripIds: string[],
  likedTripIds?: Set<string>,
): Promise<RepoResponse<TripListing[]>> {
  if (!tripIds.length) {
    return { data: [], error: null };
  }

  const { data, error, status } = await supabase
    .from("trips")
    .select(
      `
      *,
      traveler:profiles(id, full_name, avatar_url),
      trip_accepted_categories(
        category:goods_categories(
          id,
          slug,
          name
        )
      )
    `,
    )
    .in("id", tripIds);

  if (error) {
    return {
      data: null,
      error: {
        code: error.code,
        message: error.message,
        status: status,
      },
    };
  }

  const result = data.map((row) => mapTripRowToTrip(row, likedTripIds));

  return { data: result, error: null };
}

export async function getParcelsByIds(
  parcelIds: string[],
  likedTripIds?: Set<string>,
): Promise<RepoResponse<ParcelListing[]>> {
  if (!parcelIds.length) {
    return { data: [], error: null };
  }

  const { data, error, status } = await supabase
    .from("parcels")
    .select(
      `*, sender:profiles(id,full_name,avatar_url), parcel_categories(
      category:goods_categories(
      id,
      slug,
      name
      ))`,
    )
    .in("id", parcelIds);

  if (error) {
    return {
      data: null,
      error: {
        code: error.code,
        message: error.message,
        status: status,
      },
    };
  }

  return {
    data: data.map((row) => toParcelMapper(row, likedTripIds)) ?? [],
    error: null,
  };
}

export async function getFavListingIds(
  userId: string,
  column: "trip_id" | "parcel_id",
): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await getFavItem(userId, column);
  if (error) return [];
  return (
    data
      ?.map((v) => (column === "parcel_id" ? v.parcel_id : v.trip_id))
      .filter((id): id is string => Boolean(id)) ?? []
  );
}
