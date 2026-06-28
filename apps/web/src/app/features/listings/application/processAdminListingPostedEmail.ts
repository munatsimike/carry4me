import { supabase } from "@/app/shared/supabase/client";

type PostedListingType = "parcel" | "trip";

/** Notify Carry4Me admins when a new trip or parcel is posted. Failures are logged only. */
export function processAdminListingPostedEmailInBackground(
  listingType: PostedListingType,
  listingId: string,
): void {
  void supabase.functions
    .invoke("notify-admin-listing-posted", {
      body: {
        listing_type: listingType,
        listing_id: listingId,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.error("notify-admin-listing-posted invoke failed:", error);
      }
    })
    .catch((err) => {
      console.error("notify-admin-listing-posted failed:", err);
    });
}
