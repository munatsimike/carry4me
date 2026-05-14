import type { Country } from "./Country";

export interface City {
  id: number;
  country_id: number;
  name: string;
  created_at?: string;

  country?: Country;
}