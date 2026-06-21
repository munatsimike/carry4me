import type { ParcelListing } from "../../parcels/domain/Parcel";
import { SupabaseParcelRepository } from "../../parcels/data/SupabaseParcelRepository";
import type { TripListing } from "../../trips/domain/Trip";
import { SupabaseTripsRepository } from "../../trips/data/SupabaseTripsRepository";
import type { CarryRequest } from "../domain/CarryRequest";

const tripsRepository = new SupabaseTripsRepository();
const parcelsRepository = new SupabaseParcelRepository();

export type ListingsForNewRequest = {
  trip: TripListing;
  parcel: ParcelListing;
};

export async function loadListingsForNewRequest(
  carryRequest: CarryRequest,
): Promise<ListingsForNewRequest | null> {
  const [trips, parcels] = await Promise.all([
    tripsRepository.listTrips(undefined, carryRequest.tripId, false),
    parcelsRepository.fetchParcels(
      undefined,
      carryRequest.parcelId,
      false,
      false,
    ),
  ]);

  const trip = trips[0];
  const parcel = parcels[0];

  if (!trip || !parcel) {
    return null;
  }

  return { trip, parcel };
}
