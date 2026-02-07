import type { CarryRequestEvent } from "./CarryRequestEvent";
import type { ParcelSnapshot } from "./ParcelSnapShot";
import type { TripSnapshot } from "./TripSnapshot";

export type CarryRequest = {
  carryRequestId:string,
  parcelId: string;
  tripId: string;
  senderUserId: string;
  travelerUserId: string;
  initiatorRole: string;
  status: string;
  parcelSnapshot: ParcelSnapshot;
  tripSnapshot: TripSnapshot;
  events: CarryRequestEvent;
};