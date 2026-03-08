import type { GoodsItem } from "@/types/Ui";

export type CreateParcel = {
  senderUserId: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  weightKg: number;
  price: number;
  items: GoodsItem[];
};

