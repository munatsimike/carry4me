import {
  CARRY_REQUEST_STATUSES,
  type CarryRequestStatus,
} from "../domain/CreateCarryRequest";

export default function statusColor(status: CarryRequestStatus) {
  let color = "";
  switch (status) {
    case CARRY_REQUEST_STATUSES.PAID_OUT:
      color = "bg-status-success";
      break;
    case CARRY_REQUEST_STATUSES.PENDING_PAYMENT:
    case CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE:
    case CARRY_REQUEST_STATUSES.PENDING_HANDOVER:
    case CARRY_REQUEST_STATUSES.PENDING_PAYOUT:
    case CARRY_REQUEST_STATUSES.IN_TRANSIT:
      color = "bg-status-pending";
      break;
    case CARRY_REQUEST_STATUSES.REJECTED:
    case CARRY_REQUEST_STATUSES.CANCELLED:
      color = "bg-status-inactive";
      break;
  }
  return color;
}
