import {
  CARRY_REQUEST_STATUSES,
  type CarryRequestStatus,
} from "../domain/CreateCarryRequest";

export const toCarryRequestStatusMapper: Record<string, CarryRequestStatus> = {
  pending_acceptance: CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE,
  rejected: CARRY_REQUEST_STATUSES.REJECTED,
  cancelled: CARRY_REQUEST_STATUSES.CANCELLED,
  pending_payment: CARRY_REQUEST_STATUSES.PENDING_PAYMENT,
  pending_handover: CARRY_REQUEST_STATUSES.PENDING_HANDOVER,
  in_transit: CARRY_REQUEST_STATUSES.IN_TRANSIT,
  pending_payout: CARRY_REQUEST_STATUSES.PENDING_PAYOUT,
  paid_out: CARRY_REQUEST_STATUSES.PAID_OUT,
};
 