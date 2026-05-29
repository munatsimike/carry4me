import { supabase } from "@/app/shared/supabase/client";
import { requireData, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type { TripsRepository } from "../domain/TripRepository";
import type { CreateTripListing } from "../domain/CreateTrip";
import { TRIPSTATUSES, type TripListing } from "../domain/Trip";
import { mapTripRowToTrip } from "../domain/tripmappers";
import {
  deleteById,
  getFavListingIds,
} from "@/app/shared/Authentication/domain/SupabaseHelper";
import type { TripDto } from "../application/TripDto";
import {
  emptyPaginatedResult,
  type ListingPageParams,
  type PaginatedResult,
} from "@/types/Pagination";

type BrowseQuery = {
  ilike(column: string, pattern: string): unknown;
  eq(column: string, value: string | number): unknown;
  gte(column: string, value: number): unknown;
  lte(column: string, value: number): unknown;
  in(column: string, values: string[]): unknown;
  order(column: string, options: { ascending: boolean }): unknown;
  range(from: number, to: number): unknown;
};

export class SupabaseTripsRepository implements TripsRepository {
  async editTrip(editTrip: Partial<TripDto>): Promise<string> {
    const { data, error, status } = await supabase
      .from("trips")
      .update(editTrip)
      .eq("id", editTrip.id)
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  async deleteTrip(parcelId: string): Promise<string> {
    return deleteById(parcelId, "trips");
  }

  async tripsById(userId: string, tripId: string): Promise<TripListing[]> {
    return this.listTrips(userId, tripId, true);
  }

  async reserveWeight(tripId: string, parcelWeight: number): Promise<string> {
    const {
      data: trip,
      error: fetchError,
      status: fetchStatus,
    } = await supabase
      .from("trips")
      .select("reserved_weight_kg")
      .eq("id", tripId)
      .single();

    throwIfSupabaseError(fetchError, fetchStatus);

    const currentReservedWeight = trip.reserved_weight_kg ?? 0;
    const newReservedWeight = currentReservedWeight + parcelWeight;

    const { data, error, status } = await supabase
      .from("trips")
      .update({ reserved_weight_kg: newReservedWeight })
      .eq("id", tripId)
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  async isTripActive(tripId: string): Promise<boolean> {
    const { data, error, status } = await supabase
      .from("trips")
      .select("id")
      .eq("id", tripId)
      .eq("status", TRIPSTATUSES.ACTIVE)
      .maybeSingle();

    throwIfSupabaseError(error, status);

    return !!data;
  }

  async availableSpace(tripId: string, parcelWeight: number): Promise<boolean> {
    const { data, status, error } = await supabase.rpc(
      "trip_has_available_capacity",
      {
        p_trip_id: tripId,
        p_required_weight: parcelWeight,
      },
    );

    throwIfSupabaseError(error, status);

    return data === true;
  }

  async listTrips(
    userId?: string,
    tripId?: string,
    shouldFilter?: boolean,
  ): Promise<TripListing[]>;
  async listTrips(
    userId: string | undefined,
    params: ListingPageParams,
  ): Promise<PaginatedResult<TripListing>>;
  async listTrips(
    userId?: string,
    tripIdOrParams?: string | ListingPageParams,
    shouldFilter: boolean = false,
  ): Promise<TripListing[] | PaginatedResult<TripListing>> {
    const params =
      typeof tripIdOrParams === "object" ? tripIdOrParams : undefined;
    const tripId =
      typeof tripIdOrParams === "string" ? tripIdOrParams : undefined;

    const categoryTripIds = await this.getTripIdsForCategories(
      params?.filters.goodsCategories ?? [],
    );

    if (params && categoryTripIds && categoryTripIds.length === 0) {
      return emptyPaginatedResult<TripListing>(params.page, params.pageSize);
    }

    const query = supabase.from("trips").select(
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
      params ? { count: "exact" } : undefined,
    );

    if (tripId) {
      query.eq("id", tripId);
    }

    if (shouldFilter && userId) {
      query.eq("traveler_user_id", userId);
    }
    query.eq("status", TRIPSTATUSES.ACTIVE);

    if (params) {
      this.applyTripBrowseFilters(query, params, categoryTripIds);
    }

    const { data, error, status, count } = await query;

    throwIfSupabaseError(error, status);

    const favTripIds = await getFavListingIds(userId ?? "", "trip_id");
    const favTripIdSet = new Set(favTripIds);
    const items = (data ?? []).map((row) => mapTripRowToTrip(row, favTripIdSet));

    if (params) {
      const total = count ?? 0;

      return {
        items,
        total,
        page: params.page,
        pageSize: params.pageSize,
        hasNextPage: params.page * params.pageSize < total,
        hasPreviousPage: params.page > 1,
      };
    }

    return items;
  }

  async createTrip(userId: string, input: CreateTripListing): Promise<string> {
    const { data, error, status } = await supabase
      .from("trips")
      .insert({
        traveler_user_id: userId,
        origin_country: input.originCountry,
        origin_city: input.originCity,
        origin_city_is_custom: input.originCityIsCustom,
        destination_country: input.destinationCountry,
        destination_city: input.destinationCity,
        depart_date: input.departureDate,
        arrive_date: input.arrivalDate ?? null,
        capacity_kg: input.capacityKg,
        price_per_kg: input.pricePerKg,
        status: input.status,
      })
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  private async getTripIdsForCategories(
    categories: string[],
  ): Promise<string[] | null> {
    if (categories.length === 0) return null;

    const { data, error, status } = await supabase
      .from("trip_accepted_categories")
      .select("trip_id, category:goods_categories!inner(name)")
      .in("category.name", categories);

    throwIfSupabaseError(error, status);

    return [...new Set((data ?? []).map((row) => row.trip_id))];
  }

  private applyTripBrowseFilters(
    query: BrowseQuery,
    params: ListingPageParams,
    categoryTripIds: string[] | null,
  ) {
    const { filters, page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (filters.searchCountry.trim()) {
      query.ilike("origin_country", filters.searchCountry.trim());
    }

    if (filters.searchCity.trim()) {
      query.ilike("origin_city", filters.searchCity.trim());
    }

    if (filters.departDate) {
      query.eq("depart_date", filters.departDate);
    }

    if (filters.priceRange.min > 0) {
      query.gte("price_per_kg", filters.priceRange.min);
    }

    if (filters.priceRange.max > 0) {
      query.lte("price_per_kg", filters.priceRange.max);
    }

    if (filters.weightRange.max > 0) {
      query.gte("capacity_kg", filters.weightRange.min);
      query.lte("capacity_kg", filters.weightRange.max);
    }

    if (categoryTripIds) {
      query.in("id", categoryTripIds);
    }

    switch (filters.sortOption) {
      case "date-asc":
        query.order("depart_date", { ascending: true });
        break;
      case "price-asc":
        query.order("price_per_kg", { ascending: true });
        break;
      case "price-desc":
        query.order("price_per_kg", { ascending: false });
        break;
      case "weight-desc":
        query.order("capacity_kg", { ascending: false });
        break;
      default:
        query.order("depart_date", { ascending: true });
    }

    query.range(from, to);
  }
}
