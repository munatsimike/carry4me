import type { ParcelItem } from "./CreateParcel";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";

export type Parcel = {
  id: string;
  user: UserProfile;
  categories: GoodsCategory[];
  route: {
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
  };

  weightKg: number;
  items: ParcelItem[];
  pricePerKg: number;
};
