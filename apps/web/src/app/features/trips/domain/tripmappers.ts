// features/trips/domain/trip.mappers.ts

import type { Trip } from "./Trip";
export function mapTripRowToTrip(row: any): Trip {
  const acceptedGoods =
    row.trip_accepted_categories?.map((x: any) => x.category).filter(Boolean) ??
    [];

  return {
    id: row.id,
    user: {
      id: row.traveler?.id,
      fullName: row.traveler?.full_name,
    },
    route: {
      originCountry: row.origin_country,
      originCity: row.origin_city,
      destinationCountry: row.destination_country,
      destinationCity: row.destination_city,
    },
    acceptedGoods: acceptedGoods.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    pricePerKg: row.price_per_kg,
    capacityKg: row.capacity_kg,
    departDate: row.depart_date,
    arriveDate: row.arrive_date,
    status: row.status,
  };
}
