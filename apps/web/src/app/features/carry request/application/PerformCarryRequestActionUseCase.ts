import type { success } from "zod";
import type { CreateNotificationUseCase } from "../carry request events/application/CreateNotificationUseCase";
import type { CarryRequest } from "../domain/CarryRequest";
import { type CarryRequestEventType } from "../domain/CarryRequestEvent";
import {
  ROLES,
  type CarryRequestStatus,
  type Role,
} from "../domain/CreateCarryRequest";
import type { UIActionKey } from "../ui/ActionsMapper";
import type { CreateCarryRequestEventUseCase } from "./CreateCarryRequestEventUseCase";
import type { UpdateCarryRequestUseCase } from "./UpdateCarryRequestUseCase";

export class PerformCarryRequestActionUseCase {
  updateCarryRequest: UpdateCarryRequestUseCase;
  createEvent: CreateCarryRequestEventUseCase;
  createNotification: CreateNotificationUseCase;

  constructor(
    updateCarryRequest: UpdateCarryRequestUseCase,
    createEvent: CreateCarryRequestEventUseCase,
    createNotification: CreateNotificationUseCase,
  ) {
    this.createNotification = createNotification;
    this.createEvent = createEvent;
    this.updateCarryRequest = updateCarryRequest;
  }

  async execute(
    action: UIActionKey,
    actorUserId: string,
    carryRequest: CarryRequest,
  ) {
    const spec = TRANSITIONS[action];
    if (!spec) return { ok: false as const };

    // Guard invalid transitions
    if (!spec.from.includes(carryRequest.status)) {
      return { ok: false as const, reason: "INVALID_STATUS" as const };
    }

    // Derive roles
    const actorRole =
      carryRequest.senderUserId === actorUserId ? ROLES.SENDER : ROLES.TRAVELER;

    const recipientId =
      carryRequest.senderUserId === actorUserId
        ? carryRequest.travelerUserId
        : carryRequest.senderUserId;

    // Status update
    if (spec.to) {
      await this.updateCarryRequest.execute(
        carryRequest.carryRequestId,
        spec.to,
      );
    }

    // Event
    if (spec.eventType) {
      await this.createEvent.execute({
        type: spec.eventType,
        carryRequestId: carryRequest.carryRequestId,
        actorUserId,
      });

      await this.createNotification.execute({
        type: spec.eventType,
        userId: recipientId,
        title: this.buildTitle(spec.eventType),
        body: this.buildBody(spec.eventType, actorRole),
        link: "/requests",
      });
    }

    return { success: true as const, action };
  }

  private buildTitle(event: CarryRequestEventType) {
    switch (event) {
      case "REQUEST_SENT":
        return "Request sent";
      case "REQUEST_ACCEPTED":
        return "Request accepted";
      case "REQUEST_REJECTED":
        return "Request rejected";
      case "PAYMENT_COMPLETED":
        return "Payment completed";
      default:
        return "Request update";
    }
  }

  private buildBody(event: CarryRequestEventType, role: Role) {
    switch (event) {
      case "REQUEST_ACCEPTED":
        return role === ROLES.SENDER
          ? "The sender accepted your request."
          : "The traveler accepted your request.";
      default:
        return "Your request was updated.";
    }
  }
}

type TransitionSpec = {
  from: CarryRequestStatus[];
  to?: CarryRequestStatus; // some actions don't change status
  eventType?: CarryRequestEventType;
};

const TRANSITIONS: Record<UIActionKey, TransitionSpec> = {
  ACCEPT: {
    from: ["PENDING_ACCEPTANCE"],
    to: "PENDING_PAYMENT",
    eventType: "REQUEST_ACCEPTED",
  },

  REJECT: {
    from: ["PENDING_ACCEPTANCE"],
    to: "REJECTED",
    eventType: "REQUEST_REJECTED",
  },

  CANCEL: {
    from: ["PENDING_ACCEPTANCE", "PENDING_PAYMENT"],
    to: "CANCELLED",
    eventType: "REQUEST_CANCELED",
  },

  PAY: {
    from: ["PENDING_PAYMENT"],
    to: "PENDING_HANDOVER",
    eventType: "PAYMENT_COMPLETED",
  },

  CONFIRM_HANDOVER: {
    from: ["PENDING_HANDOVER"],
    to: "IN_TRANSIT",
    eventType: "PARCEL_RECEIVED",
  },

  MARK_DELIVERED: {
    from: ["IN_TRANSIT"],
    to: "PENDING_PAYOUT",
    eventType: "PARCEL_DELIVERED",
  },

  RELEASE_PAYMENT: {
    from: ["PENDING_PAYOUT"],
    to: "PAID_OUT",
    eventType: "PAYMENT_RELEASED",
  },

  BROWSE_TRIPS: {
    from: [],
  },

  BROWSE_PARCELS: {
    from: [],
  },
};
