import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { TripListing } from "@/app/features/trips/domain/Trip";

export type DashboardSuggestedMatches = {
  activeParcels: ParcelListing[];
  activeTrips: TripListing[];
  suggestedTrips: TripListing[];
  suggestedParcels: ParcelListing[];
};

const MAX_SUGGESTIONS = 5;
const CLOSE_DATE_RANGE_DAYS = 3;

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function routesMatch(
  source: ParcelListing | TripListing,
  candidate: ParcelListing | TripListing,
) {
  return (
    normalize(source.route.originCountry) ===
      normalize(candidate.route.originCountry) &&
    normalize(source.route.originCity) === normalize(candidate.route.originCity) &&
    normalize(source.route.destinationCountry) ===
      normalize(candidate.route.destinationCountry) &&
    normalize(source.route.destinationCity) ===
      normalize(candidate.route.destinationCity)
  );
}

function getListingDate(listing: ParcelListing | TripListing) {
  const date = (listing as Partial<TripListing> & { departDate?: string })
    .departDate;
  return date ? new Date(date) : null;
}

function datesMatch(
  source: ParcelListing | TripListing,
  candidate: ParcelListing | TripListing,
) {
  const sourceDate = getListingDate(source);
  const candidateDate = getListingDate(candidate);

  if (!sourceDate || !candidateDate) return true;

  const diffMs = Math.abs(sourceDate.getTime() - candidateDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= CLOSE_DATE_RANGE_DAYS;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function matchListings<TCandidate extends ParcelListing | TripListing>(
  sources: Array<ParcelListing | TripListing>,
  candidates: TCandidate[],
  currentUserId: string,
) {
  return uniqueById(
    sources.flatMap((source) =>
      candidates.filter(
        (candidate) =>
          candidate.user.id !== currentUserId &&
          routesMatch(source, candidate) &&
          datesMatch(source, candidate),
      ),
    ),
  ).slice(0, MAX_SUGGESTIONS);
}

export function buildDashboardSuggestedMatches(input: {
  userId: string;
  activeParcels: ParcelListing[];
  activeTrips: TripListing[];
  allParcels: ParcelListing[];
  allTrips: TripListing[];
}): DashboardSuggestedMatches {
  return {
    activeParcels: input.activeParcels,
    activeTrips: input.activeTrips,
    suggestedTrips: matchListings(
      input.activeParcels,
      input.allTrips,
      input.userId,
    ),
    suggestedParcels: matchListings(
      input.activeTrips,
      input.allParcels,
      input.userId,
    ),
  };
}
