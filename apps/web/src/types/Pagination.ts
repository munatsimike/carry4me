import type { CustomRange, SortOption } from "./Ui";

export type ListingFilters = {
  searchCountry: string;
  searchCity: string;
  departDate?: string;
  priceRange: CustomRange;
  weightRange: CustomRange;
  goodsCategories: string[];
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
