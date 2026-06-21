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
  type: string;
  actor_user_id: string | null;
  metadata: CarryRequest["events"]["metadata"];
  created_at?: string;
}

export interface RawCarryRequestRow {
  id: string;
  parcel_id: string;
  trip_id: string;
  sender_user_id: string;
  traveler_user_id: string;
  initiator_role: CarryRequest["initiatorRole"];
  status: CarryRequest["status"];
  payment_expires_at?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_status?: string | null;
  handover_confirmations: RawConfirmation[];
  parcel_snapshot: RawParcelSnapshot;
  trip_snapshot: RawTripSnapshot;
  events: RawEvent | RawEvent[] | null;
}

function resolveLatestEvent(
  events: RawCarryRequestRow["events"],
  requestId: string,
): RawEvent {
  if (Array.isArray(events)) {
    if (events.length === 0) {
      return {
        carry_request_id: requestId,
        type: "REQUEST_SENT",
        actor_user_id: null,
        metadata: {},
      };
    }

    return [...events].sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    )[0]!;
  }

  if (events && typeof events === "object") {
    return events;
  }

  return {
    carry_request_id: requestId,
    type: "REQUEST_SENT",
    actor_user_id: null,
    metadata: {},
  };
}

export function toCarryRequestMapper(row: RawCarryRequestRow): CarryRequest {
  const confirmations = row.handover_confirmations ?? [];

  const senderConfirmed = confirmations.some(
    (c) => c.role === "SENDER" && Boolean(c.confirmed_at),
  );

  const travelerConfirmed = confirmations.some(
    (c) => c.role === "TRAVELER" && Boolean(c.confirmed_at),
  );

  if (!row.parcel_snapshot || !row.trip_snapshot) {
    throw new Error("Invalid carry request row (missing snapshots)");
  }

  const latestEvent = resolveLatestEvent(row.events, row.id);

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
    paymentExpiresAt: row.payment_expires_at ?? null,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    paymentStatus: row.payment_status ?? null,

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
      carryRequestId: latestEvent.carry_request_id,
      type: latestEvent.type as CarryRequest["events"]["type"],
      actorUserId: latestEvent.actor_user_id ?? "",
      metadata: latestEvent.metadata,
    },
  };
}
