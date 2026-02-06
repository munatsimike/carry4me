import type { Parcel } from "../../parcels/domain/Parcel";
import type { Trip } from "../../trips/domain/Trip";
import type { CarryRequest, Role, Status } from "./CarryRequest";

export function toCarryRequestMapper(
  parcel: Parcel,
  trip: Trip,
  initiatorRole: Role,
  status: Status,
): CarryRequest {
  const pricePerKg =
    initiatorRole === "sender" ? trip.pricePerKg : parcel.pricePerKg;
  return {
    parcel_id: parcel.id,
    trip_id: trip.id,
    sender_user_id: parcel.user.id,
    traveler_user_id: trip.user.id,
    initiator_role: initiatorRole,
    status: status,
    parcel_snapshot: {
      senderName: parcel.user.fullName,
      items: parcel.items,
      weight_kg: parcel.weightKg,
      price_per_kg: pricePerKg,
      origin: {
        country: parcel.route.originCountry,
        city: parcel.route.originCity,
      },
      destination: {
        country: parcel.route.destinationCountry,
        city: parcel.route.destinationCity,
      },
      categories: parcel.categories,
    },
    trip_snapshot: {
      traveler_name: trip.user.fullName,
      departure_date: trip.departDate,
      origin: {
        country: trip.route.originCountry,
        city: trip.route.originCity,
      },
      destination: {
        country: trip.route.destinationCountry,
        city: trip.route.destinationCity,
      },
    },
  };
}
