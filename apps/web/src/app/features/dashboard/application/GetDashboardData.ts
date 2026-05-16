import type { DashboardData } from "../domain/DashboardData";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";

export class GetDashboardDataUseCase {
  dashboardRepo: DashboardDataRepository;

  constructor(dashboardRepo: DashboardDataRepository) {
    this.dashboardRepo = dashboardRepo;
  }

  async execute(userId: string): Promise<DashboardData> {
    const { stats } = await this.dashboardRepo.getDashboardStats(userId);
    const href = "/requests?tab=ongoing";

    return {
      stats: [
        {
          itemName: "Active Requests",
          count: stats.activeRequests,
          link: href,
        },
        {
          itemName: "Deliveries",
          count: stats.delivered,
          link: "/requests?tab=completed",
        },
        {
          itemName: "Posted Trips",
          count: stats.postedTrips,
          link: "/my/trips",
        },
        {
          itemName: "Posted  Parcels",
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
          itemName: "Awaiting Payment",
          status: "Pending",
          count: stats.awaitingPayment,
          link: href,
        },
        {
          itemName: "Awaiting Handover",
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
    };
  }
}
