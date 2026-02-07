import type { CarryRequest } from "./CarryRequest";

export function toCarryRequestMapper(row: any): CarryRequest {
  return {
    carryRequestId: row.id,
    parcelId: row.parcel_id,
    tripId: row.trip_id,
    senderUserId: row.sender_user_id,
    travelerUserId: row.traveler_user_id,
    initiatorRole: row.initiator_role,
    status: row.status,
    parcelSnapshot: {
      senderName: row.fullName,
      items: row.items, //[]
      weightKg: row.weight_kg,
      pricePerKg: row.price_per_kg,
      origin: {
        country: row.country,
        city: row.city,
      },
      destination: {
        country: row.country,
        city: row.city,
      },
      categories: row.categories, //[]
    },
    tripSnapshot: {
      travelerName: row.fullName,
      departureDate: row.departure_date,
      origin: {
        country: row.country,
        city: row.city,
      },
      destination: {
        country: row.country,
        city: row.city,
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
