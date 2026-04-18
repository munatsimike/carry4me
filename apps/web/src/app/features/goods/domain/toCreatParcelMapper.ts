
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import type { CreateParcel } from "../../parcels/domain/CreateParcel";
import { PARCELSTATUSES } from "../../parcels/domain/Parcel";

export default function toCreateParcelMapper(
  userId: string,
  values: ParcelFormFields,
): CreateParcel {
  return {
    status: PARCELSTATUSES.OPEN,
    senderUserId: userId,
    originCountry: values.originCountry,
    originCity: values.originCity,
    destinationCountry: values.destinationCountry,
    destinationCity: values.destinationCity,
    weightKg: values.weight,
    items: values.itemDescriptions,
    price: values.pricePerKg,
  };
}
