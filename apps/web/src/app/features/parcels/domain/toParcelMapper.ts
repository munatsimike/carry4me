import type { ParcelListing } from "./Parcel";
import { fetchPublicUrl } from "@/app/shared/data/SupabaseAuthRepository";
import { normalizeGoodsCondition } from "@/app/shared/goodsCondition";
import { normalizePaymentPreference } from "@/app/shared/listings/paymentPreference";

type ParcelRow = {
  id: string;
  price: number;
  status: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  parcel_categories: {
    category: { id: string; name: string; slug: string };
  }[];
  origin_city: string;
  origin_country: string;
  origin_city_is_custom: boolean;
  destination_city: string;
  destination_country: string;
  weight_kg: number;
  payment_preference?: "handover" | "delivery" | "flexible" | null;
  items: {
    quantity: number;
    description: string;
    size?: string;
    condition?: string;
  }[];
};

export function toParcelMapper(row: ParcelRow,  likedTripIds: Set<string> = new Set(),): ParcelListing {
  const publicUrl = fetchPublicUrl(row.sender.avatar_url);
  const rows =
    row.parcel_categories.map((x) => x.category).filter(Boolean) ?? [];
  return {
    type: "parcel",
    id: row.id,
    pricePerKg: row.price,
    user: {
      id: row.sender.id,
      fullName: row.sender.full_name,
      email: "",
      avatarUrl: publicUrl,
      countryCode: null,
      city: null,
      phoneNumber: null,
    },

    goodsCategory: rows.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
    })),
    route: {
      originCity: row.origin_city,
      originCountry: row.origin_country,
      originCityIsCustom: row.origin_city_is_custom === true,
      destinationCity: row.destination_city,
      destinationCountry: row.destination_country,
    },
    weightKg: row.weight_kg,
    paymentPreference: normalizePaymentPreference(row.payment_preference),
    items: row.items.map((x) => ({
      quantity: x.quantity,
      description: x.description,
      size: x.size?.trim() ?? "",
      condition: normalizeGoodsCondition(x.condition),
    })),
    status: row.status,
    isLiked: likedTripIds?.has(row.id) ?? false
  };
}
