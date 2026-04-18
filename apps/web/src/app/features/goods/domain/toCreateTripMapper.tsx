import type { TripFormFields } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import type { CreateTripListing } from "../../trips/domain/CreateTrip";
import { TRIPSTATUSES } from "../../trips/domain/Trip";


export default function toCreateTrip(
  formValues: TripFormFields,
): CreateTripListing {
  return {
    originCountry: formValues.originCountry,
    originCity: formValues.originCity,
    destinationCountry: formValues.destinationCountry,
    destinationCity: formValues.destinationCity,
    departureDate: formValues.departureDate,
    arrivalDate: null,
    capacityKg: formValues.weight,
    pricePerKg: formValues.pricePerKg,
    status: TRIPSTATUSES.ACTIVE
  };
}
