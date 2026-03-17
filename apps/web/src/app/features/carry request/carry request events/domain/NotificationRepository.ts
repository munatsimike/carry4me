import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { CarryRequestNotification } from "./CarryRequestNotification";

export interface NotificationRepository {
  markAllAsRead(userId: string): Promise<RepoResponse<string>>;
  fetchNotifications(
    userId: string,
    limit?: number,
  ): Promise<RepoResponse<CarryRequestNotification[]>>;
}
