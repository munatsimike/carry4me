import { supabase } from "@/app/shared/supabase/client";
import type { NotificationRepository } from "../domain/NotificationRepository";
import type { CarryRequestNotification } from "../domain/Notification";

export class SupabaseNotificationRepository implements NotificationRepository {
  markAsRead(notificationId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  markAllAsRead(userId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getUnreadCount(userId: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  fetchNotifications(userId: string): Promise<Notification> {
    throw new Error("Method not implemented.");
  }
  async createNotification(
    notification: CarryRequestNotification,
  ): Promise<void> {
    await supabase
      .from("notifications")
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        metadata: notification.metadata ?? null,
      })
      .throwOnError();
  }
}
