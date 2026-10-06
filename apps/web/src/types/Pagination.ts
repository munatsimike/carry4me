import type { CustomRange, SortOption } from "./Ui";
import type { TripCapacityUnit } from "@/app/features/trips/domain/tripCapacityUnit";

export type ListingFilters = {
  searchCountry: string;
  searchCity: string;
  departDate?: string;
  priceRange: CustomRange;
  weightRange: CustomRange;
  /** When set with a space range, trips are filtered by kg or bags. */
  capacityUnit?: TripCapacityUnit;
  goodsCategories: string[];
  /** Origin country codes to include (e.g. ["NL", "UK"]). Empty = no country filter. */
  originCountries: string[];
  sortOption?: SortOption;
};

export type ListingPageParams = {
  page: number;
  pageSize: number;
  filters: ListingFilters;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function emptyPaginatedResult<T>(
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items: [],
    total: 0,
    page,
    pageSize,
    hasNextPage: false,
    hasPreviousPage: page > 1,
  };
}
