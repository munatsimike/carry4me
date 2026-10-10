import type { CarryRequest } from "./CarryRequest";
import { isPastPaymentWindowWithCheckoutGrace } from "./carryRequestPaymentGrace";
import {
  CARRY_REQUEST_STATUSES,
  type CarryRequestStatus,
} from "./CreateCarryRequest";

function isOneSidedHandover(request: CarryRequest): boolean {
  const { senderConfirmed, travelerConfirmed, bothConfirmed } =
    request.handoverState;
  return (senderConfirmed || travelerConfirmed) && !bothConfirmed;
}

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

  if (
    isOneSidedHandover(request) &&
    (request.status === CARRY_REQUEST_STATUSES.IN_TRANSIT ||
      request.status === CARRY_REQUEST_STATUSES.PENDING_PAYOUT)
  ) {
    return CARRY_REQUEST_STATUSES.PENDING_HANDOVER;
  }

  return request.status;
}
