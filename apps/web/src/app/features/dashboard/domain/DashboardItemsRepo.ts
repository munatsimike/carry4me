import type { ActivityItem } from "./ActivityItem";

export interface DashboardItemsRepository{
    fetchActivityList(userId: string): Promise<ActivityItem[]>
}