import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SupabaseLocationRepository } from "../shared/data/SupabaseLocationRepository";

const locationRepository = new SupabaseLocationRepository();

export function useLocations(selectedCountry?: string) {
  const query = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationRepository.getLocations(),
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
        ?.find((loc) => loc.country.code === selectedCountry)
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
