import type { CreateTripListing } from "../../trips/domain/CreateTrip";
import type { TripFormFields } from "../../dashboard/CreateTripModal";

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
    capacityKg: formValues.availableSpace,
    pricePerKg: formValues.pricePerKg,
  };
}
