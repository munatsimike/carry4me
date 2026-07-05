/** Marketplace destination is Zimbabwe-only; city is selected from a fixed list. */
export const FIXED_DESTINATION_COUNTRY = "Zimbabwe";

export const DESTINATION_CITY_OPTIONS = [
  "Harare",
  "Mutare",
  "Bulawayo",
  "Gweru",
  "Masvingo",
] as const;

export type DestinationCity = (typeof DESTINATION_CITY_OPTIONS)[number];

export const FIXED_DESTINATION_CITY: DestinationCity = "Harare";

/** City label for route hovers and summaries (legacy rows may store country as city). */
export function formatDestinationCityForDisplay(
  destinationCity?: string | null,
  destinationCountry?: string | null,
): string {
  const city = destinationCity?.trim();
  if (!city) return FIXED_DESTINATION_CITY;

  const country = destinationCountry?.trim().toLowerCase();
  if (
    city.toLowerCase() === "zimbabwe" ||
    (country && city.toLowerCase() === country)
  ) {
    return FIXED_DESTINATION_CITY;
  }

  return city;
}
