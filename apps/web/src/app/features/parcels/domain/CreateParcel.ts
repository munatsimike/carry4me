import type { GoodsItem } from "@/types/Ui";
import type { ParcelStatuses } from "./Parcel";
import type { PaymentPreference } from "@/app/shared/listings/paymentPreference";

export type CreateParcel = {
  senderUserId: string;
  originCountry: string;
  originCity: string;
  originCityIsCustom: boolean;
  destinationCountry: string;
  destinationCity: string;
  weightKg: number;
  price: number;
  items: GoodsItem[];
  paymentPreference: PaymentPreference;
  status: ParcelStatuses
};

