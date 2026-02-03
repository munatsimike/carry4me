import type { CreateTrip } from "../../trips/domain/CreateTrip";
import type { FormFields } from "../../dashboard/CreateTripModal";

export default function toCreateTrip(formValues: FormFields): CreateTrip {
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
