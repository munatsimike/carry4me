import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import {
  currencySymbolForCountry,
  formatListingRouteLabel,
  sendAdminListingPostedEmail,
} from "../_shared/emails/adminListingPostedEmail.ts";

type RequestBody = {
  listing_type?: "trip" | "parcel";
  listing_id?: string;
};

type TripRow = {
  id: string;
  traveler_user_id: string;
  origin_city: string;
  destination_city: string;
  origin_country: string;
  depart_date: string;
  capacity_kg: number;
  price_per_kg: number;
};

type ParcelRow = {
  id: string;
  sender_user_id: string;
  origin_city: string;
  destination_city: string;
  origin_country: string;
  weight_kg: number;
  price: number;
};

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    if (!resendApiKey) {
      return jsonResponse({ error: "Email service is not configured" }, 500);
    }

    let body: RequestBody = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const listingType = body.listing_type;
    const listingId = body.listing_id?.trim();

    if (listingType !== "trip" && listingType !== "parcel") {
      return jsonResponse({ error: "listing_type must be trip or parcel" }, 400);
    }

    if (!listingId) {
      return jsonResponse({ error: "listing_id is required" }, 400);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);

    if (listingType === "trip") {
      const { data: trip, error } = await supabaseAdmin
        .from("trips")
        .select(
          "id, traveler_user_id, origin_city, destination_city, origin_country, depart_date, capacity_kg, price_per_kg",
        )
        .eq("id", listingId)
        .maybeSingle<TripRow>();

      if (error) {
        console.error("notify-admin-listing-posted trip load failed", error.message);
        return jsonResponse({ error: "Failed to load trip" }, 500);
      }

      if (!trip) {
        return jsonResponse({ error: "Trip not found" }, 404);
      }

      if (trip.traveler_user_id !== user.id) {
        return jsonResponse({ error: "Not authorized" }, 403);
      }

      const outcome = await sendAdminListingPostedEmail(
        {
          listingType: "trip",
          listingId: trip.id,
          routeLabel: formatListingRouteLabel(
            trip.origin_city,
            trip.destination_city,
          ),
          travelDate: trip.depart_date,
          availableSpaceKg: Number(trip.capacity_kg),
          pricePerKg: Number(trip.price_per_kg),
          currencySymbol: currencySymbolForCountry(trip.origin_country),
        },
        resendApiKey,
      );

      return jsonResponse({ ok: true, sent: true, messageId: outcome.messageId });
    }

    const { data: parcel, error } = await supabaseAdmin
      .from("parcels")
      .select(
        "id, sender_user_id, origin_city, destination_city, origin_country, weight_kg, price",
      )
      .eq("id", listingId)
      .maybeSingle<ParcelRow>();

    if (error) {
      console.error("notify-admin-listing-posted parcel load failed", error.message);
      return jsonResponse({ error: "Failed to load parcel" }, 500);
    }

    if (!parcel) {
      return jsonResponse({ error: "Parcel not found" }, 404);
    }

    if (parcel.sender_user_id !== user.id) {
      return jsonResponse({ error: "Not authorized" }, 403);
    }

    const outcome = await sendAdminListingPostedEmail(
      {
        listingType: "parcel",
        listingId: parcel.id,
        routeLabel: formatListingRouteLabel(
          parcel.origin_city,
          parcel.destination_city,
        ),
        weightKg: Number(parcel.weight_kg),
        budgetPerKg: Number(parcel.price),
        currencySymbol: currencySymbolForCountry(parcel.origin_country),
      },
      resendApiKey,
    );

    return jsonResponse({ ok: true, sent: true, messageId: outcome.messageId });
  } catch (err) {
    if (isResponse(err)) return err;

    console.error("notify-admin-listing-posted error", err);
    return jsonResponse({ error: "Could not send admin listing notification" }, 500);
  }
});
