import type { Listing } from "@/app/shared/Authentication/domain/Listing";

export type Item = {
  quantity: number;
  description: string;
};
export interface TripListing extends Listing {
  departDate: string;
  arriveDate?: string | null;
}

