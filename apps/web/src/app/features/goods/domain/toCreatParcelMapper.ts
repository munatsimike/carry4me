import type { ParcelFormFields } from "../../parcels/ui/CreateParcelModal";
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
    weightKg: values.weight,
    items: values.itemDescriptions,
    price: values.pricePerKg,
  };
}
