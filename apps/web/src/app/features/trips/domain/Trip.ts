import type { Listing } from "@/app/shared/Authentication/domain/Listing";

export const TRIPSTATUSES = {
  ARCHIVED: "ARCHIVED",
  FULL: "FULL",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export type TripStatuses = (typeof TRIPSTATUSES)[keyof typeof TRIPSTATUSES];
export interface TripListing extends Listing {
  departDate: string;
  arriveDate?: string;
  /** Total trip capacity — used when prefilling the edit form. */
  capacityKg?: number;
}

export function getTripsWithAvailableSpace<T extends { weightKg: number }>(
  trips: T[],
): T[] {
  return trips.filter((trip) => trip.weightKg > 0);
}
