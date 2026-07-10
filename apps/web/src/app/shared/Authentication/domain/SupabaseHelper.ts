import type { TripListing } from "@/app/features/trips/domain/Trip";
import { AppError, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import { supabase } from "../../supabase/client";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import { mapTripRowToTrip } from "@/app/features/trips/domain/tripmappers";
import { toParcelMapper } from "@/app/features/parcels/domain/toParcelMapper";

export type Table = "parcels" | "trips";

const ACTIVE_CARRY_REQUEST_STATUSES = [
  "PENDING_ACCEPTANCE",
  "PENDING_PAYMENT",
  "PENDING_HANDOVER",
  "IN_TRANSIT",
  "PENDING_PAYOUT",
] as const;

async function assertListingHasNoActiveCarryRequests(
  listingId: string,
  table: Table,
): Promise<void> {
  const listingColumn = table === "trips" ? "trip_id" : "parcel_id";
  const listingLabel = table === "trips" ? "trip" : "parcel";

  const { data, error, status } = await supabase
    .from("carry_requests")
    .select("id")
    .eq(listingColumn, listingId)
    .in("status", [...ACTIVE_CARRY_REQUEST_STATUSES])
    .limit(1);

  throwIfSupabaseError(error, status);

  if ((data ?? []).length > 0) {
    throw new AppError({
      code: "ACTIVE_REQUEST_EXISTS",
      message: `This ${listingLabel} has an active request. Cancel the request first before deleting it.`,
    });
  }
}

export async function deleteById(
  listingId: string,
  table: Table,
): Promise<string> {
  await assertListingHasNoActiveCarryRequests(listingId, table);

  const { data, error, status } = await supabase
    .from(table)
    .delete()
    .eq("id", listingId)
    .select("id");

  throwIfSupabaseError(error, status);

  if (!data || data.length === 0) {
    throw new AppError({
      code: "NOT_FOUND",
      message: `${
        table === "trips" ? "Trip" : "Parcel"
      } not found or not authorized.`,
    });
  }

  return listingId;
}

type FavouriteRow = {
  trip_id?: string | null;
  parcel_id?: string | null;
  created_at?: string;
};

export async function getFavItem(
  userId: string,
  column: "trip_id" | "parcel_id",
): Promise<FavouriteRow[]> {
  const { data, error, status } = await supabase
    .from("favourites")
    .select(`${column}, created_at`)
    .eq("user_id", userId)
    .not(column, "is", null)
    .order("created_at", { ascending: false });

  throwIfSupabaseError(error, status);

  return data ?? [];
}

export async function getTripsByIds(
  tripIds: string[],
  likedTripIds?: Set<string>,
): Promise<TripListing[]> {
  if (!tripIds.length) {
    return [];
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

  throwIfSupabaseError(error, status);

  return (data ?? []).map((row) => mapTripRowToTrip(row, likedTripIds));
}

export async function getParcelsByIds(
  parcelIds: string[],
  likedTripIds?: Set<string>,
): Promise<ParcelListing[]> {
  if (!parcelIds.length) {
    return [];
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

  throwIfSupabaseError(error, status);

  return (data ?? []).map((row) => toParcelMapper(row, likedTripIds));
}

export async function getFavListingIds(
  userId: string,
  column: "trip_id" | "parcel_id",
): Promise<string[]> {
  if (!userId) return [];
  const data = await getFavItem(userId, column);
  return data
    .map((v) => (column === "parcel_id" ? v.parcel_id : v.trip_id))
    .filter((id): id is string => Boolean(id));
}
