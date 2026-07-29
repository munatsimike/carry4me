import { format } from "date-fns";
import { dateFormat } from "@/types/Ui";
import type { CarryRequest } from "../domain/CarryRequest";
import {
  CARRY_REQUEST_EVENT_TYPES,
  type CarryRequestEventType,
} from "../domain/CarryRequestEvent";
import {
  CARRY_REQUEST_STATUSES,
  type CarryRequestStatus,
} from "../domain/CreateCarryRequest";

const archivedDateTimeFormat = "d MMM yyyy, HH:mm";
const archivedTimeFormat = "HH:mm";

function findEventCreatedAt(
  events: CarryRequest["eventHistory"],
  type: CarryRequestEventType,
): string | null {
  const matches = events.filter((event) => event.type === type);
  if (matches.length === 0) return null;

  return (
    [...matches].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )[0]?.createdAt ?? null
  );
}

function formatArchivedDate(
  iso: string | null | undefined,
  withTime = false,
): string {
  if (!iso?.trim()) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return format(date, withTime ? archivedDateTimeFormat : dateFormat);
}

function formatArchivedTime(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return format(date, archivedTimeFormat);
}

export function getArchivedRequestDateDisplay(
  status: CarryRequestStatus,
  request: CarryRequest,
): { label: string; value: string; hoverValue?: string } {
  switch (status) {
    case CARRY_REQUEST_STATUSES.PAID_OUT:
      return {
        label: "Delivered on",
        value: formatArchivedDate(
          findEventCreatedAt(
            request.eventHistory,
            CARRY_REQUEST_EVENT_TYPES.PARCEL_DELIVERED,
          ) ??
            findEventCreatedAt(
              request.eventHistory,
              CARRY_REQUEST_EVENT_TYPES.PAYMENT_RELEASED,
            ) ??
            request.updatedAt,
        ),
      };
    case CARRY_REQUEST_STATUSES.EXPIRED: {
      const expiredIso = request.expiredAt ?? request.updatedAt;
      return {
        label: "Expired on",
        value: formatArchivedDate(expiredIso),
        hoverValue: formatArchivedTime(expiredIso),
      };
    }
    case CARRY_REQUEST_STATUSES.CANCELLED:
      return {
        label: "Cancelled on",
        value: formatArchivedDate(
          findEventCreatedAt(
            request.eventHistory,
            CARRY_REQUEST_EVENT_TYPES.REQUEST_CANCELED,
          ) ?? request.updatedAt,
        ),
      };
    case CARRY_REQUEST_STATUSES.REJECTED:
      return {
        label: "Declined on",
        value: formatArchivedDate(
          findEventCreatedAt(
            request.eventHistory,
            CARRY_REQUEST_EVENT_TYPES.REQUEST_REJECTED,
          ) ?? request.updatedAt,
        ),
      };
    default:
      return {
        label: "Departure date",
        value: formatArchivedDate(request.tripSnapshot.departure_date),
      };
  }
}
