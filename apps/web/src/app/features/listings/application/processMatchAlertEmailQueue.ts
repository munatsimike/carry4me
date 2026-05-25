import { processEmailQueueInBackground } from "@/app/shared/supabase/processEmailQueue";

type PostedListingType = "parcel" | "trip";

const MATCH_EVENT_BY_LISTING: Record<PostedListingType, string> = {
  trip: "MATCHING_TRIP_POSTED",
  parcel: "MATCHING_PARCEL_POSTED",
};

/** After posting or editing a listing, send match-alert emails to recipients. */
export function processMatchAlertEmailQueue(
  listingType: PostedListingType,
  listingId: string,
): void {
  processEmailQueueInBackground({
    matchedListingType: listingType,
    matchedListingId: listingId,
    eventType: MATCH_EVENT_BY_LISTING[listingType],
  });
}
