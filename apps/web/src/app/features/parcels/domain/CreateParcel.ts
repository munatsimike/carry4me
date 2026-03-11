import type { GoodsItem } from "@/types/Ui";
import type { ParcelStatuses } from "./Parcel";

export type CreateParcel = {
  senderUserId: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  weightKg: number;
  price: number;
  items: GoodsItem[];
  status: ParcelStatuses
};

