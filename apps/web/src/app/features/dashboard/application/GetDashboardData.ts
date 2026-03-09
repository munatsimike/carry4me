import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { DashboardData } from "../domain/DashboardData";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";

export class GetDashboardDataUseCase {
  dashboardRepo: DashboardDataRepository;

  constructor(dashboardRepo: DashboardDataRepository) {
    this.dashboardRepo = dashboardRepo;
  }
  async execute(userId: string): Promise<Result<DashboardData>> {
    const { data, status, error } =
      await this.dashboardRepo.getDashboardStats(userId);
    if (data) {
      const stats = data.stats;
      return {
        success: true,
        data: {
          stats: [
            {
              itemName: "Active Requests",
              count: stats.totalMatches,
              link: "/requests?tab=ongoing",
            },
            {
              itemName: "Deliveries completed",
              count: stats.delivered,
              link: "/requests?tab=completed",
            },
            {
              itemName: "Posted Trips",
              count: stats.postedTrips,
              link: "/my/trips",
            },
            {
              itemName: "Posted  Parcel",
              count: stats.postedParcels,
              link: "/my/parcels",
            },
          ],
          activity: [
            {
              itemName: "Pending Approval",
              status: "Pending",
              count: stats.pendingAproval,
            },
            {
              itemName: "Awaiting payment",
              status: "Pending",
              count: stats.awaitingPayment,
            },
            {
              itemName: "Awaiting handover",
              status: "Pending",
              count: stats.awaitingHandover,
            },
            {
              itemName: "In progress",
              status: "InProgress",
              count: stats.inProgress,
            },
            {
              itemName: "Completed",
              status: "Completed",
              count: stats.delivered,
            },
          ],
        },
      };
    }

    return { success: false, error: error, status: status };
  }
}
