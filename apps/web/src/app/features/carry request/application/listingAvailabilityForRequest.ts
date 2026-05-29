import type { SupabaseParcelRepository } from "../../parcels/data/SupabaseParcelRepository";
import type { SupabaseTripsRepository } from "../../trips/data/SupabaseTripsRepository";
import type { InfoModalPayload } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

export type AcceptListingCheckInput = {
  parcelId: string;
  tripId: string;
};

export type ListingUnavailableContent = {
  title: string;
  message: string;
  iconKind: "parcel" | "trip";
  browseLabel: string;
  browsePath: string;
};

/** Validates sender parcel (OPEN) and traveler trip (ACTIVE) before accept. */
export async function getListingUnavailableOnAccept(
  parcelRepo: SupabaseParcelRepository,
  tripRepo: SupabaseTripsRepository,
  input: AcceptListingCheckInput,
): Promise<ListingUnavailableContent | null> {
  const [parcelOpen, tripActive] = await Promise.all([
    parcelRepo.isParcelOpen(input.parcelId),
    tripRepo.isTripActive(input.tripId),
  ]);

  if (!parcelOpen) {
    return {
      iconKind: "parcel",
      title: "Parcel no longer available",
      message:
        "This parcel is no longer open for delivery. Browse other parcels to find a match.",
      browseLabel: "Browse parcels",
      browsePath: "/parcels",
    };
  }

  if (!tripActive) {
    return {
      iconKind: "trip",
      title: "Trip no longer available",
      message:
        "This trip is no longer active. Browse other trips to find a match.",
      browseLabel: "Browse trips",
      browsePath: "/travelers",
    };
  }

  return null;
}

export function toListingUnavailableInfoModal(
  content: ListingUnavailableContent,
  navigate: (path: string) => void,
): Omit<InfoModalPayload, "type"> {
  return {
    title: content.title,
    message: content.message,
    label: content.browseLabel,
    onClick: () => navigate(content.browsePath),
    secondaryLabel: "Close",
  };
}
