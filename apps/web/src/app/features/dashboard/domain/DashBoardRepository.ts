import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { RequestStats } from "./stats.types";

export interface DashboardDataRepository {
  getDashboardStats(userId: string): Promise<RepoResponse<RequestStats>>;
}
