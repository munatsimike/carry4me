import type { CreateTrip } from "../../trips/domain/CreateTrip";
import type { TripFormFields } from "../../dashboard/CreateTripModal";

export default function toCreateTrip(formValues: TripFormFields): CreateTrip {
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
