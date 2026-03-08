import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import type { UserProfile } from "./authTypes";
import type { GoodsItem } from "@/types/Ui";

export type ListingType = "parcel" | "trip";

export type ListingSource = TripListing | ParcelListing;

export interface Listing {
  [x: string]: any;
  type: ListingType;
  id: string;
  user: UserProfile;
  goodsCategory: GoodsCategory[];
  items: GoodsItem[];
  route: {
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
  };
  pricePerKg: number;
  weightKg: number;
  status: "open" | "closed";
}
