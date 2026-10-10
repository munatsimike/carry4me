import type { CarryRequest } from "./CarryRequest";
import { isPastPaymentWindowWithCheckoutGrace } from "./carryRequestPaymentGrace";
import {
  CARRY_REQUEST_STATUSES,
  type CarryRequestStatus,
} from "./CreateCarryRequest";

export function isCarryRequestPaymentExpired(request: CarryRequest): boolean {
  if (request.status !== CARRY_REQUEST_STATUSES.PENDING_PAYMENT) {
    return false;
  }

  return isPastPaymentWindowWithCheckoutGrace({
    paymentExpiresAt: request.paymentExpiresAt,
    stripePaymentIntentId: request.stripePaymentIntentId,
    paymentStatus: request.paymentStatus,
  });
}

export function getEffectiveCarryRequestStatus(
  request: CarryRequest,
): CarryRequestStatus {
  if (isCarryRequestPaymentExpired(request)) {
    return CARRY_REQUEST_STATUSES.EXPIRED;
  }

  return request.status;
}
