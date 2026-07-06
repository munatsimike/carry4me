import { TRIPSTATUSES } from "../domain/Trip";

export const MY_TRIPS_STATUS_FILTERS = {
  ACTIVE: "active",
  FULL: "full",
  COMPLETED: "completed",
} as const;

export type MyTripsStatusFilter =
  (typeof MY_TRIPS_STATUS_FILTERS)[keyof typeof MY_TRIPS_STATUS_FILTERS];

export function matchesMyTripsStatusFilter(
  status: string,
  filter: MyTripsStatusFilter,
): boolean {
  const normalized = status.trim().toUpperCase();

  if (filter === MY_TRIPS_STATUS_FILTERS.ACTIVE) {
    return normalized === TRIPSTATUSES.ACTIVE;
  }

  if (filter === MY_TRIPS_STATUS_FILTERS.FULL) {
    return normalized === TRIPSTATUSES.FULL;
  }

  return (
    normalized === TRIPSTATUSES.ARCHIVED ||
    normalized === TRIPSTATUSES.INACTIVE
  );
}

export function countMyTripsByStatusFilter<
  T extends { status: string },
>(trips: T[], filter: MyTripsStatusFilter): number {
  return trips.filter((trip) => matchesMyTripsStatusFilter(trip.status, filter))
    .length;
}

export function getMyTripsFilterEmptyState(filter: MyTripsStatusFilter): {
  title: string;
  description: string;
} {
  if (filter === MY_TRIPS_STATUS_FILTERS.FULL) {
    return {
      title: "No full trips",
      description: "Trips with no remaining space will appear here.",
    };
  }

  if (filter === MY_TRIPS_STATUS_FILTERS.COMPLETED) {
    return {
      title: "No completed trips",
      description:
        "Deactivated trips and trips whose departure date has passed will appear here.",
    };
  }

  return {
    title: "No active trips",
    description: "Trips available for senders to request will appear here.",
  };
}
