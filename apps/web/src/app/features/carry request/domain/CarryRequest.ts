import type { HandoverConfirmationState } from "../handover confirmations/domain/HandoverConfirmationState";
import type { CarryRequestEvent, CarryRequestEventType } from "./CarryRequestEvent";
import type { CarryRequestStatus, Role } from "./CreateCarryRequest";
import type { ParcelSnapshot } from "./ParcelSnapShot";
import type { TripSnapshot } from "./TripSnapshot";

export type CarryRequestEventHistoryItem = {
  type: CarryRequestEventType;
  createdAt: string | null;
};

export type CarryRequest = {
   handoverState: HandoverConfirmationState
  carryRequestId: string;
  parcelId: string;
  tripId: string;
  senderUserId: string;
  travelerUserId: string;
  initiatorRole: Role;
  status: CarryRequestStatus;
  paymentExpiresAt: string | null;
  stripePaymentIntentId: string | null;
  paymentStatus: string | null;
  updatedAt: string;
  expiredAt: string | null;
  parcelSnapshot: ParcelSnapshot;
  tripSnapshot: TripSnapshot;
  events: CarryRequestEvent;
  eventHistory: CarryRequestEventHistoryItem[];
 
};
