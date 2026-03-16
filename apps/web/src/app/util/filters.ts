import type { CustomRange } from "@/types/Ui";
import type { TripListing } from "../features/trips/domain/Trip";
import type { Listing } from "../shared/Authentication/domain/Listing";


export function filterByCountryCity<T extends Listing>(
  city: string,
  country: string,
  listings: T[],
): T[] {
  const filtered = listings.filter((listing) => {
    const matchesCountry =
      !country ||
      listing.route.originCountry.toLowerCase().includes(country) ||
      listing.route.destinationCountry.toLowerCase().includes(country);

    const matchesCity =
      !city ||
      listing.route.originCity?.toLowerCase().includes(city) ||
      listing.route.destinationCity?.toLowerCase().includes(city);
    return matchesCountry && matchesCity;
  });
  return filtered;
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
  return listings.filter((listing) =>
    listing.goodsCategory.some((item) =>
      goodsCategories.some((selected) => selected === item.name),
    ),
  );
}

