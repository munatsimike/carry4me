import type { RequestStats } from "./stats.types";

export interface DashboardDataRepository {
  getDashboardStats(userId: string): Promise<RequestStats>;
}
