import type { Status } from "./CarryRequestMapper";

export default function statusColor(status: Status) {
  let color = "PENDING_ACCEPTANCE";
  switch (status) {
    case "PAID_OUT":
      color = "bg-status-success";
      break;
    case "PENDING_PAYMENT":
    case "PENDING_ACCEPTANCE":
    case "PENDING_HANDOVER":
    case "PENDING_PAYOUT":
    case "IN_TRANSIT":
      color = "bg-status-pending";
      break;
    case "REJECTED":
    case "CANCELLED":
      color = "bg-status-inactive";
      break;
  }
  return color;
}