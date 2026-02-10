import type { HandoverConfirmationState } from "../handover confirmations/domain/HandoverConfirmationState";
import type { CarryRequestEvent } from "./CarryRequestEvent";
import type { CarryRequestStatus, Role } from "./CreateCarryRequest";
import type { ParcelSnapshot } from "./ParcelSnapShot";
import type { TripSnapshot } from "./TripSnapshot";

export type CarryRequest = {
   handoverState: HandoverConfirmationState
  carryRequestId: string;
  parcelId: string;
  tripId: string;
  senderUserId: string;
  travelerUserId: string;
  initiatorRole: Role;
  status: CarryRequestStatus;
  parcelSnapshot: ParcelSnapshot;
  tripSnapshot: TripSnapshot;
  events: CarryRequestEvent;
 
};
