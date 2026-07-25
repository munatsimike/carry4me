import type { CustomRange } from "@/types/Ui";
import { expandOriginCountryFilterValues } from "@/app/Mapper";
import type { TripListing } from "../features/trips/domain/Trip";
import type { Listing } from "../shared/Authentication/domain/Listing";
import { tripAcceptsAllCategories } from "../features/goods/domain/goodsCategoryConstants";

export function filterByCountryCity<T extends Listing>(
  city: string,
  country: string,
  listings: T[],
): T[] {
  const normalize = (value?: string) => value?.toLowerCase().trim() ?? "";

  const filtered = listings.filter((listing) => {
    const matchesCountry =
      !country || normalize(listing.route.originCountry) === normalize(country);

    const matchesCity =
      !city || normalize(listing.route.originCity) === normalize(city);

    return matchesCountry && matchesCity;
  });

  return filtered;
}

/** Keeps listings whose origin country matches any selected code/name alias. */
export function filterByOriginCountries<T extends Listing>(
  originCountries: string[],
  listings: T[],
): T[] {
  if (originCountries.length === 0) return listings;

  const allowed = new Set(
    expandOriginCountryFilterValues(originCountries).map((value) =>
      value.toLowerCase().trim(),
    ),
  );

  return listings.filter((listing) =>
    allowed.has(listing.route.originCountry.toLowerCase().trim()),
  );
}

export function filterByDepartDate(
  date: string,
  listings: TripListing[],
): TripListing[] {
  const target = new Date(date).toDateString();

  const filteredList = listings.filter(
    (trip) => new Date(trip.departDate).toDateString() === target,
  );

  return filteredList;
}

export function filterByPriceRange<T extends Listing>(
  priceRange: CustomRange,
  listings: T[],
): T[] {
  const { min, max } = priceRange;

  return listings.filter((listing) => {
    const price = Number(listing.pricePerKg);

    const meetsMin = min === undefined || price >= min;
    const meetsMax = max === undefined || price <= max;

    return meetsMin && meetsMax;
  });
}

export function filterByWeightRange<T extends Listing>(
  weightRange: CustomRange,
  listings: T[],
): T[] {
  const { min, max } = weightRange;

  return listings.filter((listing) => {
    const weight = Number(listing.weightKg);

    const meetsMin = min === undefined || weight >= min;
    const meetsMax = max === undefined || weight <= max;

    return meetsMin && meetsMax;
  });
}

export function filterByGoodsCategory<T extends Listing>(
  goodsCategories: string[],
  listings: T[],
): T[] {
  if (goodsCategories.length === 0) return listings;

  return listings.filter((listing) => {
    if (listing.type === "trip" && tripAcceptsAllCategories(listing.goodsCategory)) {
      return true;
    }

    return listing.goodsCategory.some((item) =>
      goodsCategories.some((selected) => selected === item.name),
    );
  });
}
