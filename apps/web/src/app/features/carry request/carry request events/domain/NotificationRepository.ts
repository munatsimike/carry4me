import type { CarryRequestNotification } from "./Notification";

export interface NotificationRepository {
  createNotification(notification: CarryRequestNotification): Promise<void>;
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  getUnreadCount(userId: string): Promise<number> 
  fetchNotifications(userId: string): Promise<Notification>
}
