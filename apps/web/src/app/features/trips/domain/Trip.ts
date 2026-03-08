import type { Listing } from "@/app/shared/Authentication/domain/Listing";


export interface TripListing extends Listing {
  departDate: string;
  arriveDate?: string | null;
}

