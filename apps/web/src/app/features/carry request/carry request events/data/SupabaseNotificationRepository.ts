import { supabase } from "@/app/shared/supabase/client";
import { throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type { NotificationRepository } from "../domain/NotificationRepository";
import type { CarryRequestNotification } from "../domain/CarryRequestNotification";
import { toCarryRequestNotificationsMapper } from "../domain/toCarryRequestNotifications";

export class SupabaseNotificationRepository implements NotificationRepository {
  async fetchNotifications(
    userId: string,
    limit: number,
  ): Promise<CarryRequestNotification[]> {
    const { data, status, error } = await supabase
      .from("notifications")
      .select("id,user_id,type,title,body,link,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    throwIfSupabaseError(error, status);

    return (data ?? []).map(toCarryRequestNotificationsMapper);
  }

  async markAllAsRead(userId: string): Promise<string> {
    const { error, status } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    throwIfSupabaseError(error, status);

    return "Notifications marked as read";
  }
}
