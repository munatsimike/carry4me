import type { Listing } from "@/app/shared/Authentication/domain/Listing";

export const TRIPSTATUSES = {
  ARCHIVED: "ARCHIVED",
  FULL: "FULL",
  ACTIVE: "ACTIVE",
};

export type TripStatuses = (typeof TRIPSTATUSES)[keyof typeof TRIPSTATUSES];
export interface TripListing extends Listing {
  departDate: string;
  arriveDate?: string;
 
}
