
import type { ParcelSnapshot } from "./ParcelSnapShot";
import type { TripSnapshot } from "./TripSnapshot";



export const ROLES = {
  SENDER: "SENDER",
  TRAVELER: "TRAVELER",
} as const;
export type InitiatorRole = Role;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const CARRY_REQUEST_STATUSES = {
  PENDING_ACCEPTANCE: "PENDING_ACCEPTANCE",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING_HANDOVER: "PENDING_HANDOVER",
  IN_TRANSIT: "IN_TRANSIT",
  PENDING_PAYOUT: "PENDING_PAYOUT",
  PAID_OUT: "PAID_OUT",
} as const;
export type CarryRequestStatus =
  (typeof CARRY_REQUEST_STATUSES)[keyof typeof CARRY_REQUEST_STATUSES];

export type CreateCarryRequest = {
  parcelId: string;
  tripId: string;
  senderUserId: string;
  travelerUserId: string;
  initiatorRole: string;
  status: string;
  parcelSnapshot: ParcelSnapshot;
  tripSnapshot: TripSnapshot;
};
