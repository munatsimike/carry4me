import type { Parcel } from "./Parcel";
import type { ParcelItem } from "./CreateParcel";

type ParcelRow = {
  id: string;
  price: number;
  sender: {
    id: string;
    full_name: string;
  };
  parcel_categories: {
    category: { id: string; name: string; slug: string };
  }[];
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  weight_kg: number;
  items: {
    quantity: number;
    description: string;
  }[];
};

export function toParcelMapper(row: ParcelRow): Parcel {
  if (!row)
    throw new Error(
      "toParcelMapper called with empty row (parcel not found / RLS blocked)",
    );
  const rows =
    row.parcel_categories.map((x) => x.category).filter(Boolean) ?? [];
  return {
    id: row.id,
    pricePerKg: row.price,
    user: {
      id: row.sender.id,
      fullName: row.sender.full_name,
    },

    categories: rows.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
    })),
    route: {
      originCity: row.origin_city,
      originCountry: row.origin_country,
      destinationCity: row.destination_city,
      destinationCountry: row.destination_country,
    },
    weightKg: row.weight_kg,
    items: row.items.map((x: ParcelItem) => ({
      quantity: x.quantity,
      description: x.description,
    })),
  };
}
