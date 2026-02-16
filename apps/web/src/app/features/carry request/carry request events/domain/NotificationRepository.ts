import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { CarryRequestNotification } from "./CarryRequestNotification";

export interface NotificationRepository {
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  fetchNotifications(
    userId: string,
    limit?: number,
  ): Promise<RepoResponse<CarryRequestNotification[]>>;
}
