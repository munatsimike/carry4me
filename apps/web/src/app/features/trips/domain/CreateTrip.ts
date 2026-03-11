// features/trips/data/trips.repository.ts

import type { TripStatuses } from "./Trip";

export type CreateTripListing = {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate?: string | null;
  capacityKg: number;
  pricePerKg: number;
  status: TripStatuses;
};
