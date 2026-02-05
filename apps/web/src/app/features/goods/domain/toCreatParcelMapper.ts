import type { ParcelFormFields } from "../../dashboard/CreateParcelModal";
import type { CreateParcel } from "../../parcels/domain/CreateParcel";

export default function toCreateParcelMapper(
  userId: string,
  values: ParcelFormFields,
): CreateParcel {
  return {
    senderUserId: userId,
    originCountry: values.originCountry,
    originCity: values.originCity,
    destinationCountry: values.destinationCountry,
    destinationCity: values.destinationCity,
    weightKg: values.totalWeight,
    items: values.parcelItem,
  };
}
