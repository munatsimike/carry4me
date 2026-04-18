import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { DashboardData } from "../domain/DashboardData";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";

export class GetDashboardDataUseCase {
  dashboardRepo: DashboardDataRepository;

  constructor(dashboardRepo: DashboardDataRepository) {
    this.dashboardRepo = dashboardRepo;
  }
  async execute(userId: string): Promise<Result<DashboardData>> {
    const { data, error } = await this.dashboardRepo.getDashboardStats(userId);
    if (data) {
      const stats = data.stats;
      const href = "/requests?tab=ongoing";
      return {
        success: true,
        data: {
          stats: [
            {
              itemName: "Active Requests",
              count: stats.activeRequests,
              link: href,
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
              link: href,
            },
            {
              itemName: "Awaiting payment",
              status: "Pending",
              count: stats.awaitingPayment,
              link: href,
            },
            {
              itemName: "Awaiting handover",
              status: "Pending",
              count: stats.awaitingHandover,
              link: href,
            },
            {
              itemName: "In progress",
              status: "InProgress",
              count: stats.inProgress,
              link: href,
            },
            {
              itemName: "Completed",
              status: "Completed",
              count: stats.delivered,
              link: "/requests?tab=completed",
            },
          ],
        },
      };
    }

    return {
      success: false,
      error: {
        message: error?.message ? error.message : "Unexpected error has occurred",
        code: error?.code ? error.code : "",
        status: error?.status
      },
      status: null,
    };
  }
}
