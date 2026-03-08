import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { Item, TripListing } from "@/app/features/trips/domain/Trip";
import type { UserProfile } from "./authTypes";

export type ListingType = "parcel" | "trip";

export type ListingSource = TripListing | ParcelListing;

export interface Listing {
  [x: string]: any;
  type: ListingType;
  id: string;
  user: UserProfile;
  goodsCategory: GoodsCategory[];
  items: Item[];
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
