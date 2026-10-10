import {
  CircleCheck,
  CreditCard,
  Package,
  Send,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { progress } from "@/types/Ui";
import { canReleasePayoutAtHandover } from "@/app/shared/listings/paymentPreference";
import type { CarryRequest } from "../domain/CarryRequest";
import { CARRY_REQUEST_EVENT_TYPES } from "../domain/CarryRequestEvent";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type Role,
} from "../domain/CreateCarryRequest";
import { getEffectiveCarryRequestStatus } from "../domain/carryRequestEffectiveStatus";

export type CarryRequestProgressStage = {
  id: string;
  label: string;
  Icon: LucideIcon;
  completed: boolean;
};

export const progressStepIcons: Record<1 | 2 | 3 | 4 | 5 | 6, LucideIcon> = {
  1: Send,
  2: CircleCheck,
  3: CreditCard,
  4: Package,
  5: Truck,
  6: Wallet,
};

export function getProgressStageLabel(
  step: 1 | 2 | 3 | 4 | 5 | 6,
  viewerRole: Role,
): string {
  if (step === 6) {
    return viewerRole === ROLES.TRAVELER ? "Paid out" : "Released";
  }

  return progress[step];
}

function hasEvent(request: CarryRequest, type: string): boolean {
  return request.eventHistory.some((event) => event.type === type);
}

export function isCarryRequestPaymentReleased(request: CarryRequest): boolean {
  return (
    getEffectiveCarryRequestStatus(request) ===
      CARRY_REQUEST_STATUSES.PAID_OUT ||
    hasEvent(request, CARRY_REQUEST_EVENT_TYPES.PAYMENT_RELEASED)
  );
}

export function isCarryRequestAwaitingDeliveryAfterPayout(
  request: CarryRequest,
): boolean {
  return (
    canReleasePayoutAtHandover(request.paymentPreference) &&
    isCarryRequestPaymentReleased(request) &&
    !isCarryRequestDelivered(request)
  );
}

export function isCarryRequestDelivered(request: CarryRequest): boolean {
  if (hasEvent(request, CARRY_REQUEST_EVENT_TYPES.PARCEL_DELIVERED)) {
    return true;
  }

  if (canReleasePayoutAtHandover(request.paymentPreference)) {
    return false;
  }

  const status = getEffectiveCarryRequestStatus(request);
  return (
    status === CARRY_REQUEST_STATUSES.PENDING_PAYOUT ||
    status === CARRY_REQUEST_STATUSES.PAID_OUT
  );
}

export function getCarryRequestProgressStages(
  request: CarryRequest,
  viewerRole: Role,
  isInitiator: boolean,
): CarryRequestProgressStage[] {
  const status = getEffectiveCarryRequestStatus(request);
  const payoutAtHandover = canReleasePayoutAtHandover(request.paymentPreference);
  const payoutLabel = viewerRole === ROLES.TRAVELER ? "Paid out" : "Released";
  const accepted =
    status !== CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE &&
    status !== CARRY_REQUEST_STATUSES.REJECTED;
  const paid =
    accepted &&
    status !== CARRY_REQUEST_STATUSES.PENDING_PAYMENT &&
    status !== CARRY_REQUEST_STATUSES.EXPIRED;
  const collected =
    status === CARRY_REQUEST_STATUSES.IN_TRANSIT ||
    status === CARRY_REQUEST_STATUSES.PENDING_PAYOUT ||
    status === CARRY_REQUEST_STATUSES.PAID_OUT ||
    hasEvent(request, CARRY_REQUEST_EVENT_TYPES.PARCEL_RECEIVED);
  const paymentReleased = isCarryRequestPaymentReleased(request);
  const delivered = isCarryRequestDelivered(request);

  const laterStages: CarryRequestProgressStage[] = payoutAtHandover
    ? [
        {
          id: "released",
          label: payoutLabel,
          Icon: Wallet,
          completed: paymentReleased,
        },
        {
          id: "delivered",
          label: progress[5],
          Icon: Truck,
          completed: delivered,
        },
      ]
    : [
        {
          id: "delivered",
          label: progress[5],
          Icon: Truck,
          completed: delivered,
        },
        {
          id: "released",
          label: payoutLabel,
          Icon: Wallet,
          completed: paymentReleased,
        },
      ];

  const stages: CarryRequestProgressStage[] = [
    {
      id: "accepted",
      label: progress[2],
      Icon: CircleCheck,
      completed: accepted,
    },
    {
      id: "paid",
      label: progress[3],
      Icon: CreditCard,
      completed: paid,
    },
    {
      id: "collected",
      label: progress[4],
      Icon: Package,
      completed: collected,
    },
    ...laterStages,
  ];

  if (isInitiator) {
    stages.unshift({
      id: "sent",
      label: progress[1],
      Icon: Send,
      completed: true,
    });
  }

  return stages;
}
