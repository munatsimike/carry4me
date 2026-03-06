
import type { ParcelItem } from "../domain/CreateParcel";

export type ParcelDto = {
  id: string;
  category_id: string[];
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  weight_kg: number;
  items: ParcelItem[];
  price_per_kg: number;
};
