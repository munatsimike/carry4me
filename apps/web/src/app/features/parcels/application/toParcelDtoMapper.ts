import type { FieldNamesMarkedBoolean } from "react-hook-form";
import type { ParcelFormFields } from "../../dashboard/CreateParcelModal";
import type { ParcelDto } from "./ParcelDto";

export function toParcelDtoMapper(
  parcelId: string,
  values: ParcelFormFields,
  dirtyFields: FieldNamesMarkedBoolean<ParcelFormFields>,
): Partial<ParcelDto> {
  return {
    id: parcelId,
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

    items: dirtyFields.itemDescriptions ? values.itemDescriptions : undefined,
    price_per_kg: dirtyFields.pricePerKg ? values.pricePerKg : undefined,
    weight_kg: dirtyFields.totalWeight ? values.totalWeight : undefined,
  };
}
