import {
  FIXED_DESTINATION_CITY,
  FIXED_DESTINATION_COUNTRY,
} from "./fixedDestination";

export function getDestinationDefaultsFromProfile(): {
  destinationCountry: string;
  destinationCity: string;
} {
  return {
    destinationCountry: FIXED_DESTINATION_COUNTRY,
    destinationCity: FIXED_DESTINATION_CITY,
  };
}
