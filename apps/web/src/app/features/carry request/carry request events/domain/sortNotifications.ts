import type { CarryRequestNotification } from "./CarryRequestNotification";

const WORKFLOW_WINDOW_MS = 48 * 60 * 60 * 1000;

const NOTIFICATION_SORT_PRIORITY: Record<string, number> = {
  PAYMENT_COMPLETED: 100,
  PARCEL_RECEIVED: 95,
  PARCEL_DELIVERED: 95,
  PAYMENT_RELEASED: 95,
  HANDOVER_CONFIRMED: 90,
  REQUEST_ACCEPTED: 90,
  REQUEST_SENT: 85,
  REQUEST_REJECTED: 80,
  REQUEST_CANCELED: 80,
  REQUEST_EXPIRED: 80,
  MATCHING_TRIP_POSTED: 20,
  MATCHING_PARCEL_POSTED: 20,
};

const MATCH_NOTIFICATION_TYPES = new Set([
  "MATCHING_TRIP_POSTED",
  "MATCHING_PARCEL_POSTED",
]);

function notificationPriority(type: string): number {
  return NOTIFICATION_SORT_PRIORITY[type] ?? 50;
}

function isMatchNotification(type: string): boolean {
  return MATCH_NOTIFICATION_TYPES.has(type);
}

function isCarryRequestActionNotification(type: string): boolean {
  return notificationPriority(type) >= 80;
}

function compareNotifications(
  a: CarryRequestNotification,
  b: CarryRequestNotification,
): number {
  const timeApartMs = Math.abs(
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (timeApartMs <= WORKFLOW_WINDOW_MS) {
    const aIsMatch = isMatchNotification(a.type);
    const bIsMatch = isMatchNotification(b.type);
    const aIsAction = isCarryRequestActionNotification(a.type);
    const bIsAction = isCarryRequestActionNotification(b.type);

    if (aIsMatch && bIsAction) {
      return 1;
    }

    if (aIsAction && bIsMatch) {
      return -1;
    }
  }

  const createdAtDiff =
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  const priorityDiff =
    notificationPriority(b.type) - notificationPriority(a.type);

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return b.id.localeCompare(a.id);
}

export function sortNotifications(
  notifications: CarryRequestNotification[],
): CarryRequestNotification[] {
  return [...notifications].sort(compareNotifications);
}
