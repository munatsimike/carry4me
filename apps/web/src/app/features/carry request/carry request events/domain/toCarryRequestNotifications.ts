import type { CarryRequestEventType } from "../../domain/CarryRequestEvent";
import type { CarryRequestNotification } from "./CarryRequestNotification";

type NotificationRow = {
  id: string;
  user_id: string;
  type: CarryRequestEventType;
  title: string;
  body: string;
  link: string;
  created_at: string;
  read_at: string;
};

export function toCarryRequestNotificationsMapper(
  row: NotificationRow,
): CarryRequestNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}
