import type { CarryRequest } from "./CarryRequest";
type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null;
}

function get<T>(obj: AnyRecord, key: string): T | undefined {
  return obj[key] as T | undefined;
}

type Confirmation = { role?: unknown; confirmed_at?: unknown };

export function toCarryRequestMapper(row: unknown): CarryRequest {
  if (!isRecord(row)) {
    throw new Error("Invalid carry request row (not an object)");
  }

  const confirmationsRaw = get<unknown>(row, "handover_confirmations");
  const confirmations: Confirmation[] = Array.isArray(confirmationsRaw)
    ? (confirmationsRaw as Confirmation[])
    : [];

  const senderConfirmed = confirmations.some((c) =>
    isRecord(c) && c.role === "SENDER" && Boolean(c.confirmed_at),
  );

  const travelerConfirmed = confirmations.some((c) =>
    isRecord(c) && c.role === "TRAVELER" && Boolean(c.confirmed_at),
  );

  const parcelSnapshot = get<AnyRecord>(row, "parcel_snapshot");
  const tripSnapshot = get<AnyRecord>(row, "trip_snapshot");
  const events = get<AnyRecord>(row, "events");

  if (!parcelSnapshot || !tripSnapshot || !events) {
    throw new Error("Invalid carry request row (missing snapshots/events)");
  }

  const parcelOrigin = get<AnyRecord>(parcelSnapshot, "origin");
  const parcelDestination = get<AnyRecord>(parcelSnapshot, "destination");
  const tripOrigin = get<AnyRecord>(tripSnapshot, "origin");
  const tripDestination = get<AnyRecord>(tripSnapshot, "destination");

  if (!parcelOrigin || !parcelDestination || !tripOrigin || !tripDestination) {
    throw new Error("Invalid carry request row (missing origin/destination)");
  }

  return {
    carryRequestId: row.id as string,
    parcelId: row.parcel_id as string,
    tripId: row.trip_id as string,
    senderUserId: row.sender_user_id as string,
    travelerUserId: row.traveler_user_id as string,
    initiatorRole: row.initiator_role as CarryRequest["initiatorRole"],
    status: row.status as CarryRequest["status"],

    handoverState: {
      senderConfirmed,
      travelerConfirmed,
      bothConfirmed: senderConfirmed && travelerConfirmed,
    },

    parcelSnapshot: {
      sender_name: parcelSnapshot.sender_name as string,
      items: parcelSnapshot.items as CarryRequest["parcelSnapshot"]["items"],
      weight_kg: parcelSnapshot.weight_kg as number,
      price_per_kg: parcelSnapshot.price_per_kg as number,
      origin: {
        country: parcelOrigin.country as string,
        city: parcelOrigin.city as string,
      },
      destination: {
        country: parcelDestination.country as string,
        city: parcelDestination.city as string,
      },
      categories:
        parcelSnapshot.categories as CarryRequest["parcelSnapshot"]["categories"],
    },

    tripSnapshot: {
      traveler_name: tripSnapshot.traveler_name as string,
      departure_date: tripSnapshot.departure_date as string,
      origin: {
        country: tripOrigin.country as string,
        city: tripOrigin.city as string,
      },
      destination: {
        country: tripDestination.country as string,
        city: tripDestination.city as string,
      },
    },

    events: {
      carryRequestId: events.carry_request_id as string,
      type: events.type as CarryRequest["events"]["type"],
      actorUserId: events.actor_user_id as string,
      metadata: events.metadata as CarryRequest["events"]["metadata"],
    },
  };
}