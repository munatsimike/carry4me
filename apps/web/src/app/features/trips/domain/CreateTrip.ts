// features/trips/data/trips.repository.ts

export type CreateTripListing = {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate?: string | null;
  capacityKg: number;
  pricePerKg: number;
};
