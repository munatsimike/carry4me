import { format } from "date-fns";
import { dateFormat } from "@/types/Ui";
import type { CarryRequest } from "../domain/CarryRequest";
import { CARRY_REQUEST_EVENT_TYPES } from "../domain/CarryRequestEvent";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type Role,
} from "../domain/CreateCarryRequest";
import { getEffectiveCarryRequestStatus } from "../domain/carryRequestEffectiveStatus";
import { formatPaymentWindowLabel } from "../domain/carryRequestPaymentWindow";

export type CarryRequestUI = {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  description: string;
};

function formatPayoutReleasedDate(request: CarryRequest): string {
  const matches = request.eventHistory.filter(
    (event) => event.type === CARRY_REQUEST_EVENT_TYPES.PAYMENT_RELEASED,
  );
  const iso =
    (matches.length > 0
      ? [...matches].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        )[0]?.createdAt
      : null) ?? request.updatedAt;

  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return format(date, dateFormat);
}

export function mapCarryRequestToUI(
  request: CarryRequest,
  viewerRole: Role,
): CarryRequestUI {
  const isInitiator = request.initiatorRole === viewerRole;

  let currentStep: CarryRequestUI["currentStep"] = 1;
  let title = "";
  let description = "";
  const roleText =
    request.initiatorRole === ROLES.TRAVELER ? "sender" : "traveler";

  switch (getEffectiveCarryRequestStatus(request)) {
    case CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE:
      currentStep = 1;
      title = isInitiator ? "Pending response" : "Request pending";
      description = isInitiator
        ? `Awaiting the ${roleText}'s response. You’ll be notified once the ${roleText} responds.`
        : "You’ve received a request from a traveler to carry your parcel on their trip.";
      break;

    case CARRY_REQUEST_STATUSES.PENDING_PAYMENT:
      currentStep = 2;
      title =
        viewerRole === ROLES.SENDER
          ? "Waiting for payment"
          : "Waiting for sender payment";
      description =
        viewerRole === ROLES.SENDER
          ? `This trip is reserved for ${formatPaymentWindowLabel()}. Make payment before the reservation expires.`
          : `You've accepted this carry request. The sender has ${formatPaymentWindowLabel()} to complete payment. Otherwise, the request will expire, and your reserved weight will be released.`;
      break;

    case CARRY_REQUEST_STATUSES.PENDING_HANDOVER: {
      currentStep = 3;
      title = "Awaiting handover";

      const otherParty =
        viewerRole === ROLES.SENDER ? "traveler" : "sender";
      const viewerConfirmed =
        viewerRole === ROLES.SENDER
          ? request.handoverState.senderConfirmed
          : request.handoverState.travelerConfirmed;
      const otherPartyConfirmed =
        viewerRole === ROLES.SENDER
          ? request.handoverState.travelerConfirmed
          : request.handoverState.senderConfirmed;

      if (!request.handoverState.senderConfirmed && !request.handoverState.travelerConfirmed) {
        description = `Arrange the handover with the ${otherParty} and confirm once the parcel is handed over.`;
      } else if (viewerConfirmed && !otherPartyConfirmed) {
        description = `You have confirmed handover. We are waiting for the ${otherParty} to confirm.`;
      } else if (!viewerConfirmed && otherPartyConfirmed) {
        description = `The ${otherParty} has confirmed handover. Please confirm once the parcel has been handed over.`;
      } else {
        description = `Arrange the handover with the ${otherParty} and confirm once the parcel is handed over.`;
      }
      break;
    }

    case CARRY_REQUEST_STATUSES.IN_TRANSIT:
      currentStep = 4;
      title = viewerRole === ROLES.SENDER ? "In transit" : "Pending delivery";
      description =
        viewerRole === ROLES.SENDER
          ? "Check your email or in-app notifications for the payment code."
          : "Deliver the parcel to the recipient, then confirm delivery.";
      break;

    case CARRY_REQUEST_STATUSES.PENDING_PAYOUT:
      currentStep = 5;
      title = "Pending payout";
      description =
        viewerRole === ROLES.SENDER
          ? "Check your email or in-app notifications for the payment code."
          : "Enter the payment code to receive your payout.";
      break;

    case CARRY_REQUEST_STATUSES.PAID_OUT: {
      currentStep = 6;
      title = "Request complete";
      const payoutDate = formatPayoutReleasedDate(request);
      description =
        viewerRole === ROLES.SENDER
          ? "Payment was released to the traveler. This request is now complete."
          : payoutDate
            ? `Payout released on ${payoutDate}.`
            : "Payout was released. This request is now complete.";
      break;
    }

    case CARRY_REQUEST_STATUSES.REJECTED:
      currentStep = 1;
      title = "Request declined";
      description =
        `${isInitiator ? "Traveler" : "Sender"}` +
        ` declined your request. You can browse other available ` +
        `${isInitiator ? "trips" : "parcels"}.`;
      break;

    case CARRY_REQUEST_STATUSES.CANCELLED:
      currentStep = 3;
      title = "Request cancelled";
      description =
        "You’ve canceled this request. The traveler has been notified.";
      break;

    case CARRY_REQUEST_STATUSES.EXPIRED:
      currentStep = 2;
      title = "Request expired";
      description =
        "Payment was not completed in time. You can send a new request.";
      break;
  }

  return { title, description, currentStep };
}
