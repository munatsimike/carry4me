import type { CarryRequest } from "./CarryRequest";

export function toCarryRequestMapper(row: any): CarryRequest {
  const confirmations = row.handover_confirmations ?? [];
  const senderConfirmed = confirmations.some(
    (c: any) => c.role === "SENDER" && c.confirmed_at,
  );
  const travelerConfirmed = confirmations.some(
    (c: any) => c.role === "TRAVELER" && c.confirmed_at,
  );

  return {
    carryRequestId: row.id,
    parcelId: row.parcel_id,
    tripId: row.trip_id,
    senderUserId: row.sender_user_id,
    travelerUserId: row.traveler_user_id,
    initiatorRole: row.initiator_role,
    status: row.status,

    handoverState: {
      senderConfirmed,
      travelerConfirmed,
      bothConfirmed: senderConfirmed && travelerConfirmed,
    },
    parcelSnapshot: {
      sender_name: row.parcel_snapshot.sender_name,
      items: row.parcel_snapshot.items, //[]
      weight_kg: row.parcel_snapshot.weight_kg,
      price_per_kg: row.parcel_snapshot.price_per_kg,
      origin: {
        country: row.parcel_snapshot.origin.country,
        city: row.parcel_snapshot.origin.city,
      },
      destination: {
        country: row.parcel_snapshot.destination.country,
        city: row.parcel_snapshot.destination.city,
      },
      categories: row.parcel_snapshot.categories, //[]
    },
    tripSnapshot: {
      traveler_name: row.trip_snapshot.traveler_name,
      departure_date: row.trip_snapshot.departure_date,
      origin: {
        country: row.trip_snapshot.origin.country,
        city: row.trip_snapshot.origin.city,
      },
      destination: {
        country: row.trip_snapshot.destination.country,
        city: row.trip_snapshot.destination.city,
      },
    },

    events: {
      carryRequestId: row.events.carry_request_id,
      type: row.events.type,
      actorUserId: row.events.actor_user_id,
      metadata: row.events.metadata,
    },
  };
}
