import { PARCELSTATUSES } from "@/app/features/parcels/domain/Parcel";
import { TRIPSTATUSES } from "@/app/features/trips/domain/Trip";
import type {
  Listing,
  ListingType,
} from "@/app/shared/Authentication/domain/Listing";

export function formatListingStatus(
  status: string,
  listingType?: ListingType,
): string {
  const normalized = status.trim().toUpperCase();
  if (normalized === TRIPSTATUSES.INACTIVE || normalized === PARCELSTATUSES.INACTIVE) {
    return "Inactive";
  }
  if (listingType === "parcel" && normalized === PARCELSTATUSES.ARCHIVED) {
    return "Delivered";
  }
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function statusBadgeClass(
  status: string,
  listingType?: ListingType,
): string {
  const normalized = status.trim().toUpperCase();

  if (normalized === "ACTIVE" || normalized === "OPEN") {
    return "bg-success-50 text-success-500 border-success-200";
  }

  if (normalized === TRIPSTATUSES.INACTIVE || normalized === PARCELSTATUSES.INACTIVE) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (normalized === "FULL" || normalized === "MATCHED") {
    return "bg-primary-50 text-primary-500 border-primary-200";
  }

  if (listingType === "parcel" && normalized === PARCELSTATUSES.ARCHIVED) {
    return "bg-success-50 text-success-500 border-success-200";
  }

  if (normalized === "ARCHIVED") {
    return "bg-neutral-100 text-neutral-500 border-neutral-200";
  }

  return "bg-neutral-100 text-neutral-600 border-neutral-200";
}

export function canManageOwnTripListing(listing: Listing): boolean {
  return listing.type === "trip" && listing.status === TRIPSTATUSES.ACTIVE;
}

export function canManageOwnParcelListing(listing: Listing): boolean {
  return listing.type === "parcel" && listing.status === PARCELSTATUSES.OPEN;
}

export function canManageOwnListing(listing: Listing): boolean {
  if (listing.type === "trip") return canManageOwnTripListing(listing);
  if (listing.type === "parcel") return canManageOwnParcelListing(listing);
  return false;
}

export function getListingStatusToggleLabel(
  listing: Listing,
): "Deactivate" | "Activate" | null {
  if (listing.type === "trip") {
    if (listing.status === TRIPSTATUSES.INACTIVE) return "Activate";
    if (listing.status === TRIPSTATUSES.ACTIVE) {
      return "Deactivate";
    }
    return null;
  }

  if (listing.status === PARCELSTATUSES.INACTIVE) return "Activate";
  if (listing.status === PARCELSTATUSES.OPEN) return "Deactivate";
  return null;
}
