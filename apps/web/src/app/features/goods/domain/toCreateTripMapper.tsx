import type { TripFormFields } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { resolveOriginCityForSave } from "@/app/shared/locations/cityOptions";
import type { CreateTripListing } from "../../trips/domain/CreateTrip";
import { TRIPSTATUSES } from "../../trips/domain/Trip";


export default function toCreateTrip(
  formValues: TripFormFields,
): CreateTripListing {
  const origin = resolveOriginCityForSave(
    formValues.originCity,
    formValues.originCustomCity,
  );

  return {
    originCountry: formValues.originCountry,
    originCity: origin.city,
    originCityIsCustom: origin.isCustom,
    destinationCountry: formValues.destinationCountry,
    destinationCity: formValues.destinationCity,
    departureDate: formValues.departureDate,
    arrivalDate: null,
    capacityKg: formValues.weight,
    pricePerKg: formValues.pricePerKg,
    status: TRIPSTATUSES.ACTIVE
  };
}
