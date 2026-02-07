import type { Parcel } from "../../parcels/domain/Parcel";
import type { Trip } from "../../trips/domain/Trip";
import {
  type CreateCarryRequest,
  type Role,
  type CarryRequestStatus,
  ROLES,
} from "./CreateCarryRequest";

export function toCreateCarryRequestMapper(
  parcel: Parcel,
  trip: Trip,
  initiatorRole: Role,
  status: CarryRequestStatus,
): CreateCarryRequest {
  const pricePerKg =
    initiatorRole === ROLES.SENDER ? trip.pricePerKg : parcel.pricePerKg;
  return {
    parcelId: parcel.id,
    tripId: trip.id,
    senderUserId: parcel.user.id,
    travelerUserId: trip.user.id,
    initiatorRole: initiatorRole.toLowerCase(),
    status: status.toLowerCase(),
    parcelSnapshot: {
      sender_name: parcel.user.fullName,
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
    tripSnapshot: {
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
