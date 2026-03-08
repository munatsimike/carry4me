
export type TripDto = {
  id: string;
  category_id: string[];
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  capacity_kg: number;
  price_per_kg: number;
};