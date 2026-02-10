import type { CarryRequest } from "../domain/CarryRequest";
import { CARRY_REQUEST_STATUSES, ROLES, type Role } from "../domain/CreateCarryRequest";

export type CarryRequestUI = {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  description: string;
};

export function mapCarryRequestToUI(
  request: CarryRequest,
  viewerRole: Role,
): CarryRequestUI {
  const isInitiator = request.initiatorRole === viewerRole;

  let currentStep: CarryRequestUI["currentStep"] = 1;
  let title = "";
  let description = "";
  const roletext =
    request.initiatorRole === ROLES.TRAVELER ? "sender" : "traveler";

  switch (request.status) {
    case CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE:
      currentStep = 1;
      title = `${isInitiator ? "Pending response" : "Request pending"}`;
      description = `${
        isInitiator
          ? `Awaiting ${roletext}\`s 
      response.You’ll be notified once the ${roletext} responds.`
          : `You’ve received a request from a traveler to carry your parcel on their trip.`
      }`;
      break;

    case CARRY_REQUEST_STATUSES.PENDING_PAYMENT:
      currentStep = 2;
      title = "Waiting for payment";
      description = `${viewerRole === ROLES.SENDER ? "This trip is reserved for 60 minutes. Make payment before the reservation expires." : "We are waiting for payment from the sender. You will be notified once payment is made."}`;
      break;

    case CARRY_REQUEST_STATUSES.PENDING_HANDOVER:
      currentStep = 3;
      title = "Awaiting handover";
      description = `Arrange the handover with the ${viewerRole === ROLES.SENDER ? "traveler" : "sender"} and confirm once the parcel is handed over.`;
      break;

    case CARRY_REQUEST_STATUSES.IN_TRANSIT:
      currentStep = 4;
      title = `${viewerRole === ROLES.SENDER ? "In transit" : "Pending delivery"}`;
      description = `${viewerRole === ROLES.SENDER ? "The parcel is on its way.Share the payment code with the traveler once the parcel has been delivered." : "Deliver the parcel and confirm delivery."}`;
      break;

    case CARRY_REQUEST_STATUSES.PENDING_PAYOUT:
      currentStep = 5;
      title = "Pending payout";
      description = `${viewerRole === ROLES.SENDER ? "Share the payment code with the traveler to release the payout." : "Please enter the payment code to receive your payout."}`;
      break;

    case CARRY_REQUEST_STATUSES.PAID_OUT:
      currentStep = 6;
      title = "Payment released";
      description = "Payment released to the traveler. Request is completed.";
      break;

    case CARRY_REQUEST_STATUSES.REJECTED:
      currentStep = 1;
      title = "Request declined";
      description =
        `${isInitiator ? "Traveler" : "Sender"}` +
        ` declined your request. You can browse other available ` +
        `${isInitiator ? "trips" : "parcels"}`;
      break;

    case CARRY_REQUEST_STATUSES.CANCELLED:
      currentStep = 3;
      title = "Request cancelled";
      description =
        "You’ve canceled this request. The traveler has been notified.";
      break;
  }

  return { title, description, currentStep };
}
