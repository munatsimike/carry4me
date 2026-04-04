import type { CarryRequest } from "./CarryRequest";

type ConfirmationRole = "SENDER" | "TRAVELER";

interface RawConfirmation {
  role: ConfirmationRole | null;
  confirmed_at: string | null;
}

interface RawLocation {
  country: string;
  city: string;
}

interface RawParcelSnapshot {
  sender_name: string;
  items: CarryRequest["parcelSnapshot"]["items"];
  weight_kg: number;
  price_per_kg: number;
  origin: RawLocation;
  destination: RawLocation;
  goods_category: CarryRequest["parcelSnapshot"]["goods_category"];
}

interface RawTripSnapshot {
  traveler_name: string;
  departure_date: string;
  origin: RawLocation;
  destination: RawLocation;
}

interface RawEvent {
  carry_request_id: string;
  type: CarryRequest["events"]["type"];
  actor_user_id: string;
  metadata: CarryRequest["events"]["metadata"];
}

export interface RawCarryRequestRow {
  id: string;
  parcel_id: string;
  trip_id: string;
  sender_user_id: string;
  traveler_user_id: string;
  initiator_role: CarryRequest["initiatorRole"];
  status: CarryRequest["status"];
  handover_confirmations: RawConfirmation[];
  parcel_snapshot: RawParcelSnapshot;
  trip_snapshot: RawTripSnapshot;
  events: RawEvent;
}

export function toCarryRequestMapper(row: RawCarryRequestRow): CarryRequest {
  const confirmations = row.handover_confirmations ?? [];

  const senderConfirmed = confirmations.some(
    (c) => c.role === "SENDER" && Boolean(c.confirmed_at),
  );

  const travelerConfirmed = confirmations.some(
    (c) => c.role === "TRAVELER" && Boolean(c.confirmed_at),
  );

  if (!row.parcel_snapshot || !row.trip_snapshot || !row.events) {
    throw new Error("Invalid carry request row (missing snapshots/events)");
  }

  if (
    !row.parcel_snapshot.origin ||
    !row.parcel_snapshot.destination ||
    !row.trip_snapshot.origin ||
    !row.trip_snapshot.destination
  ) {
    throw new Error("Invalid carry request row (missing origin/destination)");
  }
 

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
    parcelSnapshot: {
      sender_name: row.parcel_snapshot.sender_name,
      items: row.parcel_snapshot.items,
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
      goods_category: row.parcel_snapshot.goods_category,
    },

    events: {
      carryRequestId: row.events.carry_request_id,
      type: row.events.type,
      actorUserId: row.events.actor_user_id,
      metadata: row.events.metadata,
    },
  };
}
