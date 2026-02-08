import type { Parcel } from "../../parcels/domain/Parcel";
import type { Trip } from "../../trips/domain/Trip";
import type { CreateNotificationUseCase } from "../carry request events/application/CreateNotificationUseCase";
import { CARRY_REQUEST_EVENT_TYPES } from "../domain/CarryRequestEvent";
import { CARRY_REQUEST_STATUSES, ROLES } from "../domain/CreateCarryRequest";
import { toCarryRequestEventMapper } from "../domain/toCarryRequestEventMapper";
import { toCreateCarryRequestMapper } from "../domain/toCreateCarryRequestMapper";
import type { CreateCarryRequestUseCase } from "./CreateCarryReaquest";
import type { CreateCarryRequestEventUseCase } from "./CreateCarryRequestEventUseCase";

export class SendCarryRequestUseCase {
  createCarryRequest: CreateCarryRequestUseCase;
  createEvent: CreateCarryRequestEventUseCase;
  createNotification: CreateNotificationUseCase;

  constructor(
    createCarryRequest: CreateCarryRequestUseCase,
    createEvent: CreateCarryRequestEventUseCase,
    createNotification: CreateNotificationUseCase,
  ) {
    this.createNotification = createNotification;
    this.createEvent = createEvent;
    this.createCarryRequest = createCarryRequest;
  }

  async execute(loggedInUserId: string, parcel: Parcel, trip: Trip) {
    const userRole =
      loggedInUserId === parcel.user.id ? ROLES.SENDER : ROLES.TRAVELER;
    const actorId =
      loggedInUserId === parcel.user.id ? parcel.user.id : trip.user.id;
    const requestId = await this.createCarryRequest.execute(
      toCreateCarryRequestMapper(
        parcel,
        trip,
        userRole,
        CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE,
      ),
    );
    await this.createNotification.execute({
      userId: loggedInUserId === parcel.user.id ? trip.user.id : parcel.user.id,
      type: CARRY_REQUEST_EVENT_TYPES.REQUEST_SENT,
      title: "Request to carry a parcel",
      body: "You have received a request to carry a parcel on your trip",
      link: "/requests",
      metadata: {
        carryRequestId: requestId,
        parcelId: parcel.id,
        tripId: trip.id,
      },
    });
    await this.createEvent.execute(
      toCarryRequestEventMapper(
        requestId,
        CARRY_REQUEST_EVENT_TYPES.REQUEST_SENT,
        actorId,
      ),
    );
    return { success: true };
  }
}
