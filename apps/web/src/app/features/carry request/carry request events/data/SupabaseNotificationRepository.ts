import { supabase } from "@/app/shared/supabase/client";
import type { NotificationRepository } from "../domain/NotificationRepository";
import type { CarryRequestNotification } from "../domain/CarryRequestNotification";
import { toCarryRequestNotificationsMapper } from "../domain/toCarryRequestNotifications";

export class SupabaseNotificationRepository implements NotificationRepository {
  async fetchNotifications(
    userId: string,
    limit: number = 3,
  ): Promise<CarryRequestNotification[]> {
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,body,link,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .throwOnError();

    return (data ?? []).map(toCarryRequestNotificationsMapper);
  }
  markAsRead(notificationId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  markAllAsRead(userId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getUnreadCount(userId: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
