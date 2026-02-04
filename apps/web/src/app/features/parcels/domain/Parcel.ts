import type { ParcelItem } from "./CreateParcel";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import type { User } from "../../login/domain/AuthRepository";

export type Parcel = {
  id: string;
  user: User;
  categories: GoodsCategory[];
  route: {
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
  };

  weightKg: number;
  items: ParcelItem[];
  budget: number;
};
