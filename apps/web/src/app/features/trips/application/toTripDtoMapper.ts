import type { FieldNamesMarkedBoolean } from "react-hook-form";
import type { TripDto } from "./TripDto";
import type { TripFormFields } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import {
  hasOriginCityChanges,
  mapOriginCityDtoFields,
} from "@/app/shared/locations/mapOriginCityDtoFields";

export function toTripDtoMapper(
  tripId: string,
  values: TripFormFields,
  dirtyFields: FieldNamesMarkedBoolean<TripFormFields>,
): Partial<TripDto> {
  const originCityPatch = hasOriginCityChanges(dirtyFields)
    ? mapOriginCityDtoFields(values)
    : {};

  return {
    id: tripId,
    origin_country: dirtyFields.originCountry
      ? values.originCountry
      : undefined,
    ...originCityPatch,

    destination_country: dirtyFields.destinationCountry
      ? values.destinationCountry
      : undefined,
    destination_city: dirtyFields.destinationCity
      ? values.destinationCity
      : undefined,

    price_per_kg: dirtyFields.pricePerKg ? values.pricePerKg : undefined,
    capacity_kg: dirtyFields.weight ? values.weight : undefined,
  };
}
