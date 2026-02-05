import { boolean } from "zod";
import type { Parcel } from "./Parcel";
import type { ParcelItem } from "./CreateParcel";

export function toParcelMapper(row: any): Parcel {
  const rows =
    row.parcel_categories?.map((x: any) => x.categories).filter(boolean) ?? [];

  return {
    id: row.id,
    budget: row.price,
    user: {
      id: row.sender.id,
      fullName: row.sender.full_name,
    },

    categories: rows.map((item: any) => ({
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
