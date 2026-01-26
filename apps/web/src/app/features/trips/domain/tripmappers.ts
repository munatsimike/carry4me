// features/trips/domain/trip.mappers.ts

import type { Trip } from "./trip.type";

export function mapTripRowToTrip(row: any): Trip {
  return {
    id: row.id,
    route: {
      originCountry: row.origin_country,
      originCity: row.origin_city,
      destinationCountry: row.destination_country,
      destinationCity: row.destination_city,
      pricePerKg: row.price_per_kg,
    },
    capacityKg: row.capacity_kg,
    departDate: row.depart_date,
    arriveDate: row.arrive_date,
    status: row.status,
  };
}
