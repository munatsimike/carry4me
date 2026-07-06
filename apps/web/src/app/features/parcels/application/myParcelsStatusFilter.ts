import { PARCELSTATUSES } from "../domain/Parcel";

export const MY_PARCELS_STATUS_FILTERS = {
  ACTIVE: "active",
  MATCHED: "matched",
  COMPLETED: "completed",
} as const;

export type MyParcelsStatusFilter =
  (typeof MY_PARCELS_STATUS_FILTERS)[keyof typeof MY_PARCELS_STATUS_FILTERS];

export function matchesMyParcelsStatusFilter(
  status: string,
  filter: MyParcelsStatusFilter,
): boolean {
  const normalized = status.trim().toUpperCase();

  if (filter === MY_PARCELS_STATUS_FILTERS.ACTIVE) {
    return normalized === PARCELSTATUSES.OPEN;
  }

  if (filter === MY_PARCELS_STATUS_FILTERS.MATCHED) {
    return normalized === PARCELSTATUSES.MATCHED;
  }

  return (
    normalized === PARCELSTATUSES.ARCHIVED ||
    normalized === PARCELSTATUSES.INACTIVE
  );
}

export function countMyParcelsByStatusFilter<
  T extends { status: string },
>(parcels: T[], filter: MyParcelsStatusFilter): number {
  return parcels.filter((parcel) =>
    matchesMyParcelsStatusFilter(parcel.status, filter),
  ).length;
}

export function getMyParcelsFilterEmptyState(filter: MyParcelsStatusFilter): {
  title: string;
  description: string;
} {
  if (filter === MY_PARCELS_STATUS_FILTERS.MATCHED) {
    return {
      title: "No matched parcels",
      description:
        "Parcels with an accepted carry request will appear here.",
    };
  }

  if (filter === MY_PARCELS_STATUS_FILTERS.COMPLETED) {
    return {
      title: "No completed parcels",
      description:
        "Deactivated parcels and parcels that have finished delivery will appear here.",
    };
  }

  return {
    title: "No active parcels",
    description: "Parcels available for travelers to request will appear here.",
  };
}
