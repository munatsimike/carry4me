export type CarryRequestEventType =
  | "request_sent"
  | "request_accepted"
  | "payment_completed"
  | "parcel_received"
  | "delivered"
  | "payment_released";

export type CarryRequestEvent = {
  carryRequestId: string;
  type: CarryRequestEventType;
  actorUserId: string;
  metadata?: Record<string, unknown>;
};
