import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { queryKeys } from "@/app/lib/queryKeys";
import { getLocationUseCase } from "@/app/lib/useCases";
import { normalizeCountryCode, toCountryName } from "@/app/Mapper";
import type { MyLocation } from "@/app/shared/Authentication/domain/MyLocation";

export function matchesSelectedCountry(
  country: { code: string; name: string },
  selectedCountry: string,
) {
  const value = selectedCountry.trim();
  if (!value) return false;

  const normalized = value.toLowerCase();
  return (
    country.code.toLowerCase() === normalized ||
    country.name.toLowerCase() === normalized
  );
}

export function getCountryCodes(locations: MyLocation[] | undefined): string[] {
  return locations?.map((loc) => loc.country.code) ?? [];
}

export function getCountryNames(locations: MyLocation[] | undefined): string[] {
  return locations?.map((loc) => loc.country.name) ?? [];
}

export function getCityOptions(
  locations: MyLocation[] | undefined,
  selectedCountry?: string,
): string[] {
  if (!selectedCountry?.trim() || !locations) return [];

  return (
    locations
      .find((loc) => matchesSelectedCountry(loc.country, selectedCountry))
      ?.cities.map((city) => city.name) ?? []
  );
}

/** Resolves a stored country code (or name) to the full display name from the DB or mapper. */
export function getCountryName(
  locations: MyLocation[] | undefined,
  countryValue: string | null | undefined,
): string {
  const value = countryValue?.trim();
  if (!value) return "—";

  const fromDb = locations?.find((loc) =>
    matchesSelectedCountry(loc.country, value),
  )?.country.name;
  if (fromDb) return fromDb;

  const normalized = normalizeCountryCode(value);
  return toCountryName(normalized ?? value) ?? value;
}

/** Resolves a country display name or code to the app country code. */
export function getCountryCode(
  locations: MyLocation[] | undefined,
  countryValue: string | null | undefined,
): string | null {
  const value = countryValue?.trim();
  if (!value) return null;

  const fromDb = locations?.find((loc) =>
    matchesSelectedCountry(loc.country, value),
  )?.country.code;
  if (fromDb) return fromDb;

  return normalizeCountryCode(value) ?? value;
}

/** @deprecated Use getCountryName instead. */
export const resolveCountryDisplayName = getCountryName;

export function useLocations(selectedCountry?: string) {
  const query = useQuery({
    queryKey: queryKeys.locations.all,
    queryFn: () => getLocationUseCase.getCountries(),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const locations = query.data;
  const isReady = !query.isLoading && !query.error;

  const countryCodes = useMemo(
    () => (isReady ? getCountryCodes(locations) : []),
    [isReady, locations],
  );

  const countryNames = useMemo(
    () => (isReady ? getCountryNames(locations) : []),
    [isReady, locations],
  );

  const cityOptions = useMemo(
    () => (isReady ? getCityOptions(locations, selectedCountry) : []),
    [isReady, locations, selectedCountry],
  );

  const resolveCountryName = useCallback(
    (countryValue: string | null | undefined) =>
      getCountryName(locations, countryValue),
    [locations],
  );

  const resolveCountryCode = useCallback(
    (countryValue: string | null | undefined) =>
      getCountryCode(locations, countryValue),
    [locations],
  );

  return {
    data: locations,
    isLoading: query.isLoading,
    error: query.error,
    countryCodes,
    countryNames,
    cityOptions,
    getCountryName: resolveCountryName,
    getCountryCode: resolveCountryCode,
    /** @deprecated Use countryCodes instead. */
    countryOptions: countryCodes,
    /** @deprecated Use countryNames instead. */
    countryNameOptions: countryNames,
  };
}
