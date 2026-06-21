import type { CarryRequest } from "./CarryRequest";
import {
  CARRY_REQUEST_STATUSES,
  type CarryRequestStatus,
} from "./CreateCarryRequest";

export function isCarryRequestPaymentExpired(request: CarryRequest): boolean {
  if (request.status !== CARRY_REQUEST_STATUSES.PENDING_PAYMENT) {
    return false;
  }

  if (!request.paymentExpiresAt) {
    return false;
  }

  return new Date(request.paymentExpiresAt).getTime() <= Date.now();
}

export function getEffectiveCarryRequestStatus(
  request: CarryRequest,
): CarryRequestStatus {
  if (isCarryRequestPaymentExpired(request)) {
    return CARRY_REQUEST_STATUSES.EXPIRED;
  }

  return request.status;
}
