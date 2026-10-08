// features/trips/data/trips.repository.ts

import type { TripStatuses } from "./Trip";
import type { PaymentPreference } from "@/app/shared/listings/paymentPreference";

export type CreateTripListing = {
  originCountry: string;
  originCity: string;
  originCityIsCustom: boolean;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate?: string | null;
  capacityKg: number;
  pricePerKg: number;
  capacityUnit: "kg" | "bag";
  paymentPreference: PaymentPreference;
  status: TripStatuses;
};
