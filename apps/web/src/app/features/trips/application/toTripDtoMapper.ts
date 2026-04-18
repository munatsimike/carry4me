import type { FieldNamesMarkedBoolean } from "react-hook-form";
import type { TripDto } from "./TripDto";
import type { TripFormFields } from "@/app/shared/Authentication/UI/hooks/useTripForm";

export function toTripDtoMapper(
  tripId: string,
  values: TripFormFields,
  dirtyFields: FieldNamesMarkedBoolean<TripFormFields>,
): Partial<TripDto> {
  return {
    id: tripId,
    origin_country: dirtyFields.originCountry
      ? values.originCountry
      : undefined,
    origin_city: dirtyFields.originCity ? values.originCity : undefined,

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
