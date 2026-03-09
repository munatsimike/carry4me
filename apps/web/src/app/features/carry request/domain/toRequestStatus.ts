import type { SelectedTab } from "../ui/CarryRequestsPage";
import type { CarryRequestStatus } from "./CreateCarryRequest";

export function toRequestStatus(navTab: SelectedTab): CarryRequestStatus[] {
  switch (navTab) {
    case "ongoing":
      return [
        "PENDING_ACCEPTANCE",
        "PENDING_PAYMENT",
        "PENDING_HANDOVER",
        "IN_TRANSIT",
        "PENDING_PAYOUT",
      ];
    case "completed":
      return ["PAID_OUT"];
    case "declined":
      return ["REJECTED"];
    case "cancelled":
      return ["CANCELLED"];
  }
}
