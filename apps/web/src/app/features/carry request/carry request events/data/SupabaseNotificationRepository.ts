import { supabase } from "@/app/shared/supabase/client";
import type { NotificationRepository } from "../domain/NotificationRepository";
import type { CarryRequestNotification } from "../domain/CarryRequestNotification";
import { toCarryRequestNotificationsMapper } from "../domain/toCarryRequestNotifications";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export class SupabaseNotificationRepository implements NotificationRepository {
  async fetchNotifications(
    userId: string,
    limit: number = 3,
  ): Promise<RepoResponse<CarryRequestNotification[]>> {
    const { data, status, error } = await supabase
      .from("notifications")
      .select("id,type,title,body,link,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { data: null, error, status };
    const result = (data ?? []).map(toCarryRequestNotificationsMapper);
    return {
      data: result,
      status: null,
      error: null,
    };
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
