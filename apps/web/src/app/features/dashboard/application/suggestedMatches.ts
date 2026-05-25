import { normalizeCountryCode } from "@/app/Mapper";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import { PARCELSTATUSES } from "@/app/features/parcels/domain/Parcel";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import { TRIPSTATUSES } from "@/app/features/trips/domain/Trip";

export type DashboardSuggestedMatches = {
  activeParcels: ParcelListing[];
  activeTrips: TripListing[];
  suggestedTrips: TripListing[];
  suggestedParcels: ParcelListing[];
};

/** Parcel is on the marketplace and can receive a new carry request. */
export function isParcelEligibleForMatching(parcel: ParcelListing) {
  return parcel.status === PARCELSTATUSES.OPEN;
}

/** Trip is on the marketplace and can receive a new carry request. */
export function isTripEligibleForMatching(trip: TripListing) {
  return trip.status === TRIPSTATUSES.ACTIVE;
}

export function filterParcelsForMatching(parcels: ParcelListing[]) {
  return parcels.filter(isParcelEligibleForMatching);
}

export function filterTripsForMatching(trips: TripListing[]) {
  return trips.filter(isTripEligibleForMatching);
}

function isListingEligibleForMatching(listing: Listing) {
  return listing.type === "parcel"
    ? isParcelEligibleForMatching(listing as ParcelListing)
    : isTripEligibleForMatching(listing as TripListing);
}

const MAX_SUGGESTIONS = 5;

type Listing = ParcelListing | TripListing;

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

/** Canonical country key so UK/United Kingdom/GB and Zimbabwe/ZW match. */
function canonicalCountry(value: string | null | undefined) {
  const code = (normalizeCountryCode(value) ?? value?.trim() ?? "").toLowerCase();

  if (code === "united kingdom" || code === "gb") {
    return "uk";
  }

  if (code === "zw") {
    return "zimbabwe";
  }

  return code;
}

function countriesMatch(a: Listing, b: Listing) {
  return (
    canonicalCountry(a.route.originCountry) ===
      canonicalCountry(b.route.originCountry) &&
    canonicalCountry(a.route.destinationCountry) ===
      canonicalCountry(b.route.destinationCountry)
  );
}

function categoryKeys(category: { id: string; slug: string; name: string }) {
  return [
    normalize(category.id),
    normalize(category.slug),
    normalize(category.name),
  ].filter(Boolean);
}

/** At least one parcel category must be accepted on the trip (by id, slug, or name). */
function categoriesMatch(parcel: ParcelListing, trip: TripListing) {
  if (parcel.goodsCategory.length === 0 || trip.goodsCategory.length === 0) {
    return true;
  }

  const tripCategoryKeys = new Set(
    trip.goodsCategory.flatMap((category) => categoryKeys(category)),
  );

  return parcel.goodsCategory.some((parcelCategory) => {
    const keys = categoryKeys(parcelCategory);
    return keys.some((key) => tripCategoryKeys.has(key));
  });
}

/** Parcel weight must fit within the trip's available capacity. */
function weightFits(parcel: ParcelListing, trip: TripListing) {
  return parcel.weightKg <= trip.weightKg;
}

export function isSuggestedMatch(source: Listing, candidate: Listing) {
  if (source.type === candidate.type) {
    return false;
  }

  const parcel =
    source.type === "parcel"
      ? (source as ParcelListing)
      : (candidate as ParcelListing);
  const trip =
    source.type === "trip" ? (source as TripListing) : (candidate as TripListing);

  return (
    isListingEligibleForMatching(source) &&
    isListingEligibleForMatching(candidate) &&
    countriesMatch(source, candidate) &&
    categoriesMatch(parcel, trip) &&
    weightFits(parcel, trip)
  );
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function matchListings<TCandidate extends Listing>(
  sources: Listing[],
  candidates: TCandidate[],
  currentUserId: string,
) {
  return uniqueById(
    sources.flatMap((source) =>
      candidates.filter(
        (candidate) =>
          candidate.user.id !== currentUserId &&
          isSuggestedMatch(source, candidate),
      ),
    ),
  ).slice(0, MAX_SUGGESTIONS);
}

/** Matches on the marketplace for a listing the actor just posted or edited. */
export function countMatchesForPostedListing(
  source: Listing,
  candidates: Listing[],
  currentUserId: string,
): number {
  return candidates.filter(
    (candidate) =>
      candidate.user.id !== currentUserId &&
      isSuggestedMatch(source, candidate),
  ).length;
}

export function buildDashboardSuggestedMatches(input: {
  userId: string;
  activeParcels: ParcelListing[];
  activeTrips: TripListing[];
  allParcels: ParcelListing[];
  allTrips: TripListing[];
}): DashboardSuggestedMatches {
  const matchingParcels = filterParcelsForMatching(input.activeParcels);
  const matchingTrips = filterTripsForMatching(input.activeTrips);
  const marketplaceParcels = filterParcelsForMatching(input.allParcels);
  const marketplaceTrips = filterTripsForMatching(input.allTrips);

  return {
    activeParcels: input.activeParcels,
    activeTrips: input.activeTrips,
    suggestedTrips: matchListings(
      matchingParcels,
      marketplaceTrips,
      input.userId,
    ),
    suggestedParcels: matchListings(
      matchingTrips,
      marketplaceParcels,
      input.userId,
    ),
  };
}
