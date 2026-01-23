import type { CarryRequest } from "@/types/Ui";

export type CarryRequestUI = {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  description: string;
  canCancel: boolean;
};

export type InitiatorRole = "SENDER" | "TRAVELER";

export type Status =
  | "PENDING_ACCEPTANCE"
  | "REJECTED"
  | "CANCELLED"
  | "PENDING_PAYMENT"
  | "PENDING_HANDOVER"
  | "IN_TRANSIT"
  | "PENDING_PAYOUT"
  | "PAID_OUT";

const LABELS = {
  1: "Request sent",
  2: "Request accepted",
  3: "Payment completed",
  4: "Parcel received",
  5: "Delivered",
  6: "Payment released",
} as const;

type Role = "SENDER" | "TRAVELER";

export function mapCarryRequestToUI(
  request: CarryRequest,
  viewerRole: Role,
): CarryRequestUI {
  const isInitiator = request.initiatorRole === viewerRole;

  let currentStep: CarryRequestUI["currentStep"] = 1;
  let title = "";
  let description = "";
  let canCancel = false;

  switch (request.status) {
    case "PENDING_ACCEPTANCE":
      currentStep = 1;
      title = `${isInitiator ? "Pending response" : "Request pending"}`;
      description = `${isInitiator ? "Awaiting travelers response .You’ll be notified once the traveler responds." : "You’ve received a request to carry a parcel on your trip."}`;
      canCancel = true;
      break;

    case "PENDING_PAYMENT":
      currentStep = 2;
      title = "Waiting for payment";
      description =
        "This trip is reserved for 60 minutes . Make payment before the reservation expires.";
      canCancel = true;
      break;

    case "PENDING_HANDOVER":
      currentStep = 3;
      title = "Awaiting handover";
      description =
        "Arrange the handover with the traveler and confirm once the parcel is handed over.";
      canCancel = true;
      break;

    case "IN_TRANSIT":
      currentStep = 4;
      title = "In transit";
      description =
        "The parcel is on its way.Share the payment code with the traveler once the parcel has been delivered.";
      canCancel = false;
      break;

    case "PENDING_PAYOUT":
      currentStep = 5;
      title = "Pending payout";
      description =
        "Share the payment code with the traveler to release the payout.";
      canCancel = false;
      break;

    case "PAID_OUT":
      currentStep = 6;
      title = "Payment released";
      description = "Payment was successfully released to the traveler.";
      canCancel = false;
      break;

    case "REJECTED":
      currentStep = 1;
      title = "Request declined";
      description =
        "Traveler declined your request. You can browse other available trips.";
      canCancel = false;
      break;

    case "CANCELLED":
      currentStep = 3;
      title = "Request cancelled";
      description =
        "You’ve canceled this request. The traveler has been notified.";
      canCancel = false;
      break;
  }

  return { title, description, currentStep, canCancel };
}

export function statusColor(status: Status) {
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
