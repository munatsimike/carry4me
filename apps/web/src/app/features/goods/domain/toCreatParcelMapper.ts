
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import { resolveOriginCityForSave } from "@/app/shared/locations/cityOptions";
import type { CreateParcel } from "../../parcels/domain/CreateParcel";
import { PARCELSTATUSES } from "../../parcels/domain/Parcel";

export default function toCreateParcelMapper(
  userId: string,
  values: ParcelFormFields,
): CreateParcel {
  const origin = resolveOriginCityForSave(
    values.originCity,
    values.originCustomCity,
  );

  return {
    status: PARCELSTATUSES.OPEN,
    senderUserId: userId,
    originCountry: values.originCountry,
    originCity: origin.city,
    originCityIsCustom: origin.isCustom,
    destinationCountry: values.destinationCountry,
    destinationCity: values.destinationCity,
    weightKg: values.weight,
    items: values.itemDescriptions,
    price: values.pricePerKg,
  };
}
