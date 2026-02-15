import type { DashboardData } from "../domain/DashboardData";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";

export class GetDashboardDataUseCase {
  dashboardRepo: DashboardDataRepository;

  constructor(dashboardRepo: DashboardDataRepository) {
    this.dashboardRepo = dashboardRepo;
  }
  async execute(userId: string): Promise<DashboardData> {
    const { stats} =
      await this.dashboardRepo.getDashboardStats(userId);

    return {
      stats: [
        { itemName: "Posted Trips", count: stats.postedTrips },
        { itemName: "Posted  Parcel", count: stats.postedParcels },
        { itemName: "Deliveries completed", count: stats.delivered },
        { itemName: "Matches", count: stats.totalMatches },
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
    };
  }
}
