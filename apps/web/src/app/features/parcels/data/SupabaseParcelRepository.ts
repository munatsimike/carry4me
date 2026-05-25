import { supabase } from "@/app/shared/supabase/client";
import { requireData, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type { CreateParcel } from "../domain/CreateParcel";
import type { ParcelRepository as ParcelRepository } from "../domain/ParcelRepository";
import { PARCELSTATUSES, type ParcelListing } from "../domain/Parcel";
import { toParcelMapper } from "../domain/toParcelMapper";
import {
  deleteById,
  getFavListingIds,
} from "@/app/shared/Authentication/domain/SupabaseHelper";
import type { ParcelDto } from "../application/ParcelDto";
import {
  emptyPaginatedResult,
  type ListingPageParams,
  type PaginatedResult,
} from "@/types/Pagination";

type BrowseQuery = {
  ilike(column: string, pattern: string): unknown;
  gte(column: string, value: number): unknown;
  lte(column: string, value: number): unknown;
  in(column: string, values: string[]): unknown;
  order(column: string, options: { ascending: boolean }): unknown;
  range(from: number, to: number): unknown;
};

export class SupabaseParcelRepository implements ParcelRepository {
  async deleteParcel(parcelId: string): Promise<string> {
    return deleteById(parcelId, "parcels");
  }

  async editParcel(editParcel: Partial<ParcelDto>): Promise<string> {
    const { data, error, status } = await supabase
      .from("parcels")
      .update(editParcel)
      .eq("id", editParcel.id)
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  async isParcelOpen(parcelId: string): Promise<boolean> {
    const { data, error, status } = await supabase
      .from("parcels")
      .select("id")
      .eq("id", parcelId)
      .eq("status", PARCELSTATUSES.OPEN)
      .maybeSingle();

    throwIfSupabaseError(error, status);

    return !!data;
  }

  parcelsById(userId: string, parcelId?: string): Promise<ParcelListing[]> {
    return this.fetchParcels(userId, parcelId, true, false);
  }

  parcelsForMatching(userId: string): Promise<ParcelListing[]> {
    return this.fetchParcels(userId, undefined, true, true);
  }

  async fetchParcels(
    userId?: string,
    parcelId?: string,
    shouldFilter?: boolean,
    matchingEligibleOnly?: boolean,
  ): Promise<ParcelListing[]>;
  async fetchParcels(
    userId: string | undefined,
    params: ListingPageParams,
  ): Promise<PaginatedResult<ParcelListing>>;
  async fetchParcels(
    userId?: string,
    parcelIdOrParams?: string | ListingPageParams,
    shouldFilter: boolean = false,
    matchingEligibleOnly: boolean = false,
  ): Promise<ParcelListing[] | PaginatedResult<ParcelListing>> {
    const params =
      typeof parcelIdOrParams === "object" ? parcelIdOrParams : undefined;
    const parcelId =
      typeof parcelIdOrParams === "string" ? parcelIdOrParams : undefined;

    const categoryParcelIds = await this.getParcelIdsForCategories(
      params?.filters.goodsCategories ?? [],
    );

    if (params && categoryParcelIds && categoryParcelIds.length === 0) {
      return emptyPaginatedResult<ParcelListing>(params.page, params.pageSize);
    }

    const query = supabase.from("parcels").select(
      `*, sender:profiles(id,full_name,avatar_url), parcel_categories(
      category:goods_categories(
      id,
      slug,
      name
      ))`,
      params ? { count: "exact" } : undefined,
    );

    if (parcelId) {
      query.eq("id", parcelId);
    }

    if (shouldFilter && userId) {
      query.eq("sender_user_id", userId);
    }

    if (parcelId) {
      // Owner detail: allow OPEN, MATCHED, or ARCHIVED by id.
    } else if (shouldFilter && userId && matchingEligibleOnly) {
      // Send-request picker: only marketplace-active parcels.
      query.eq("status", PARCELSTATUSES.OPEN);
    } else if (shouldFilter && userId) {
      // My parcels: active shipments (off marketplace but visible to owner).
      query.in("status", [PARCELSTATUSES.OPEN, PARCELSTATUSES.MATCHED]);
    } else {
      // Marketplace browse: only listings available to match.
      query.eq("status", PARCELSTATUSES.OPEN);
    }

    if (params) {
      this.applyParcelBrowseFilters(query, params, categoryParcelIds);
    }

    const { data, error, status, count } = await query;

    throwIfSupabaseError(error, status);

    if (!data) {
      if (params) {
        return emptyPaginatedResult<ParcelListing>(params.page, params.pageSize);
      }

      return [];
    }

    const favParcelIds = await getFavListingIds(userId ?? "", "parcel_id");
    const favParcelIdSet = new Set(favParcelIds);
    const items = data.map((row) => toParcelMapper(row, favParcelIdSet));

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

  async createParcel(parcel: CreateParcel): Promise<string> {
    const { data, error, status } = await supabase
      .from("parcels")
      .insert({
        sender_user_id: parcel.senderUserId,
        origin_country: parcel.originCountry,
        origin_city: parcel.originCity,
        origin_city_is_custom: parcel.originCityIsCustom,
        destination_country: parcel.destinationCountry,
        destination_city: parcel.destinationCity,
        weight_kg: parcel.weightKg,
        price: parcel.price,
        status: parcel.status,
        items: parcel.items,
      })
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  private async getParcelIdsForCategories(
    categories: string[],
  ): Promise<string[] | null> {
    if (categories.length === 0) return null;

    const { data, error, status } = await supabase
      .from("parcel_categories")
      .select("parcel_id, category:goods_categories!inner(name)")
      .in("category.name", categories);

    throwIfSupabaseError(error, status);

    return [...new Set((data ?? []).map((row) => row.parcel_id))];
  }

  private applyParcelBrowseFilters(
    query: BrowseQuery,
    params: ListingPageParams,
    categoryParcelIds: string[] | null,
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

    if (filters.priceRange.min > 0) {
      query.gte("price", filters.priceRange.min);
    }

    if (filters.priceRange.max > 0) {
      query.lte("price", filters.priceRange.max);
    }

    if (filters.weightRange.max > 0) {
      query.gte("weight_kg", filters.weightRange.min);
      query.lte("weight_kg", filters.weightRange.max);
    }

    if (categoryParcelIds) {
      query.in("id", categoryParcelIds);
    }

    switch (filters.sortOption) {
      case "price-asc":
        query.order("price", { ascending: true });
        break;
      case "price-desc":
        query.order("price", { ascending: false });
        break;
      case "weight-desc":
        query.order("weight_kg", { ascending: false });
        break;
      default:
        query.order("created_at", { ascending: false });
    }

    query.range(from, to);
  }
}
