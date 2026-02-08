export const CARRY_REQUEST_EVENT_TYPES = {
  REQUEST_SENT: "REQUEST_SENT",
  REQUEST_ACCEPTED: "REQUEST_ACCEPTED",
  REQUEST_REJECTED: "REQUEST_REJECTED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  REQUEST_CANCELED: "REQUEST_CANCELED",
  PARCEL_RECEIVED: "PARCEL_RECEIVED",
  PARCEL_DELIVERED: "PARCEL_DELIVERED",
  PAYMENT_RELEASED: "PAYMENT_RELEASED",
} as const;

export type CarryRequestEventType =
  (typeof CARRY_REQUEST_EVENT_TYPES)[keyof typeof CARRY_REQUEST_EVENT_TYPES];

export type CarryRequestEvent = {
  carryRequestId: string;
  type: CarryRequestEventType;
  actorUserId: string;
  metadata?: Record<string, unknown>;
};
