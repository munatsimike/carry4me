// features/trips/data/trips.repository.ts

export type CreateTrip = {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate?: string | null;
  capacityKg: number;
  pricePerKg: number;
};
