import { fetchPublicUrl } from "@/app/shared/data/SupabaseAuthRepository";
import type { TripListing } from "./Trip";
// features/trips/domain/trip.mappers.ts
export type TripRow = {
  id: string;
  traveler: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  price_per_kg: number;
  capacity_kg: number;
  reserved_weight_kg: number;
  used_weight_kg: number;
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

export function mapTripRowToTrip(
  row: TripRow,
  likedTripIds: Set<string> = new Set(),
): TripListing {
  const publicUrl = fetchPublicUrl(row.traveler.avatar_url);
  const acceptedGoods =
    row.trip_accepted_categories?.map((x) => x.category).filter(Boolean) ?? [];

  return {
    id: row.id,
    type: "trip",
    user: {
      id: row.traveler.id,
      fullName: row.traveler.full_name,
      avatarUrl: publicUrl,
      countryCode: null,
      city: null,
      phoneNumber: null,
    },
    route: {
      originCountry: row.origin_country,
      originCity: row.origin_city,
      destinationCountry: row.destination_country,
      destinationCity: row.destination_city,
    },
    goodsCategory: acceptedGoods.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    pricePerKg: row.price_per_kg,
    weightKg: row.capacity_kg - (row.reserved_weight_kg + row.used_weight_kg),
    departDate: row.depart_date,
    arriveDate: row.arrive_date,
    status: row.status,
    items: [],
    isLiked: likedTripIds?.has(row.id) ?? false,
  };
}
