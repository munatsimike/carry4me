import type { CarryRequestNotification } from "./CarryRequestNotification";

export interface NotificationRepository {
  markAllAsRead(userId: string): Promise<string>;
  fetchNotifications(
    userId: string,
    limit?: number,
  ): Promise<CarryRequestNotification[]>;
}
