import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "@/app/lib/queryKeys";
import { getLocationUseCase } from "@/app/lib/useCases";

function matchesSelectedCountry(
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

export function useLocations(selectedCountry?: string) {
  const query = useQuery({
    queryKey: queryKeys.locations.all,
    queryFn: () => getLocationUseCase.getCountries(),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const countryOptions = useMemo(() => {
    return !query.isLoading && !query.error
      ? (query.data?.map((loc) => loc.country.code) ?? [])
      : [];
  }, [query.data, query.isLoading, query.error]);

  const cityOptions = useMemo(() => {
    if (!selectedCountry || query.isLoading || query.error) {
      return [];
    }
    return (
      query.data
        ?.find((loc) => matchesSelectedCountry(loc.country, selectedCountry))
        ?.cities.map((city) => city.name) ?? []
    );
  }, [selectedCountry, query.data, query.isLoading, query.error]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    countryOptions,
    cityOptions,
  };
}
