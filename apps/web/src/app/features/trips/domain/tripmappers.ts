// features/trips/domain/trip.mappers.ts
type TripRow = {
  id: string;
  traveler: {
    id: string;
    full_name: string;
  };
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  price_per_kg: number;
  capacity_kg: number;
  depart_date: string;
  arrive_date: string;
  status: "open" | "closed";
  trip_accepted_categories?: {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

import type { Trip } from "./Trip";
export function mapTripRowToTrip(row: TripRow): Trip {
  const acceptedGoods =
    row.trip_accepted_categories?.map((x) => x.category).filter(Boolean) ?? [];

  return {
    id: row.id,
    user: {
      id: row.traveler.id,
      fullName: row.traveler.full_name,
    },
    route: {
      originCountry: row.origin_country,
      originCity: row.origin_city,
      destinationCountry: row.destination_country,
      destinationCity: row.destination_city,
    },
    acceptedGoods: acceptedGoods.map((c) => ({
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
