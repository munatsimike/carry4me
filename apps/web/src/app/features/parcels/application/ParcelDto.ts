
import type { GoodsItem } from "@/types/Ui";

export type ParcelDto = {
  id: string;
  category_id: string[];
  origin_country: string;
  origin_city: string;
  origin_city_is_custom: boolean;
  destination_country: string;
  destination_city: string;
  weight_kg: number;
  items: GoodsItem[];
  price: number;
};
