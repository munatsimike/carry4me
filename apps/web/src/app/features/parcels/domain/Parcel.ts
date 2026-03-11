import type { Listing } from "@/app/shared/Authentication/domain/Listing";
export const PARCELSTATUSES = {
  OPEN: "OPEN",
  ARCHIVED: "ARCHIVED",
  MATCHED: "MARCHED",
} as const;

export type ParcelStatuses =
  (typeof PARCELSTATUSES)[keyof typeof PARCELSTATUSES];

export interface ParcelListing extends Listing {

}
