import { supabase } from "@/app/shared/supabase/client";
import type { NotificationRepository } from "../domain/NotificationRepository";
import type { CarryRequestNotification } from "../domain/CarryRequestNotification";
import { toCarryRequestNotificationsMapper } from "../domain/toCarryRequestNotifications";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export class SupabaseNotificationRepository implements NotificationRepository {
  async fetchNotifications(
    userId: string,
    limit: number,
  ): Promise<RepoResponse<CarryRequestNotification[]>> {
    const { data, status, error } = await supabase
      .from("notifications")
      .select("id,user_id,type,title,body,link,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    }
    const result = (data ?? []).map(toCarryRequestNotificationsMapper);
    return {
      data: result,
      error: null,
    };
  }
  async markAllAsRead(userId: string): Promise<RepoResponse<string>> {
    const { error, status } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    }

    return {
      data: "Notifications marked as read",
      error: null,
    };
  }
}
