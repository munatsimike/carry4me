import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { ParcelDto } from "./ParcelDto";
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import {
  hasOriginCityChanges,
  mapOriginCityDtoFields,
} from "@/app/shared/locations/mapOriginCityDtoFields";

export function toParcelDtoMapper(
  parcelId: string,
  values: ParcelFormFields,
  dirtyFields: FieldNamesMarkedBoolean<ParcelFormFields>,
): Partial<ParcelDto> {
  const originCityPatch = hasOriginCityChanges(dirtyFields)
    ? mapOriginCityDtoFields(values)
    : {};

  return {
    id: parcelId,
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

    items: dirtyFields.itemDescriptions ? values.itemDescriptions : undefined                        ,
    price: dirtyFields.pricePerKg ? values.pricePerKg : undefined,
    weight_kg: dirtyFields.weight ? values.weight : undefined,
  };
}
