import type {
  CarryRequestEvent,
  CarryRequestEventType,
} from "./CarryRequestEvent";

export function toCarryRequestEventMapper(
  requestId: string,
  type: CarryRequestEventType,
  actorUserId: string,
  metadata?: Record<string, unknown>,
): CarryRequestEvent {
  return {
    carryRequestId: requestId,
    type: type,
    actorUserId: actorUserId,
    metadata: metadata,
  };
}
