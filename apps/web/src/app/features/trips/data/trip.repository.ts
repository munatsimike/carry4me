// features/trips/data/trips.repository.ts

import type { Trip } from "../domain/trip.type";

export type CreateTripInput = {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate?: string | null;
  capacityKg: number;
  pricePerKg: number;
};

export interface TripsRepository {
  createTrip(input: CreateTripInput): Promise<Trip>;
  // listTrips(filters): Promise<Trip[]>
}
