import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";

/** Align profile country values with route form country codes/names. */
export function normalizeRouteCountry(
  country: string | null | undefined,
): string {
  const value = country?.trim() ?? "";
  if (!value) return "";

  const upper = value.toUpperCase();
  if (upper === "US" || upper === "USA") return "USA";
  if (upper === "GB" || upper === "UK") return "UK";
  if (upper === "ZW" || value === "Zimbabwe") return "Zimbabwe";
  if (upper === "NL" || value === "Netherlands") return "Netherlands";

  return value;
}

export function getDestinationDefaultsFromProfile(
  profile: UserProfile | null | undefined,
): { destinationCountry: string; destinationCity: string } {
  if (!profile) {
    return { destinationCountry: "", destinationCity: "" };
  }

  const destinationCountry = normalizeRouteCountry(
    profile.countryCode ?? profile.country,
  );
  const destinationCity = profile.city?.trim() ?? "";

  return { destinationCountry, destinationCity };
}
