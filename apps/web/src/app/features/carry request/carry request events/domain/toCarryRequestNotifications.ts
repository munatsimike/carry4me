import type { CarryRequestNotification } from "./CarryRequestNotification";

export function toCarryRequestNotificationsMapper(
  row: any,
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
