import type { Parcel } from "../../parcels/domain/Parcel";
import type { Trip } from "../../trips/domain/Trip";
import { type CreateCarryRequest, type Role, type CarryRequestStatus, ROLES } from "./CreateCarryRequest";

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
        senderName: parcel.user.fullName,
      items: parcel.items,
      weightKg: parcel.weightKg,
      pricePerKg: pricePerKg,
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
        travelerName: trip.user.fullName,
      departureDate: trip.departDate,
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
