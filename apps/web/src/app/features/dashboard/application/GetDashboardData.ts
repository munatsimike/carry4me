import type { DashboardData } from "../domain/DashboardData";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";

export class GetDashboardDataUseCase {
  dashboardRepo: DashboardDataRepository;

  constructor(dashboardRepo: DashboardDataRepository) {
    this.dashboardRepo = dashboardRepo;
  }
  async execute(userId: string): Promise<DashboardData> {
    const [data] = await Promise.all([
      this.dashboardRepo.getDashboardStats(userId),
    ]);

    return {
      stats: [
        { itemName: "Posted Trips", count: data.stats.postedTrips },
        { itemName: "Posted  Parcel", count: data.stats.postedParcels },
        { itemName: "Deliveries completed", count: data.stats.delivered },
        { itemName: "Matches", count: data.stats.totalMatches },
      ],
      activity: [
        {
          itemName: "Pending Approval",
          status: "Pending",
          count: data.stats.pendingAproval,
        },
        {
          itemName: "Awaiting payment",
          status: "Pending",
          count: data.stats.awaitingPayment,
        },
        {
          itemName: "Awaiting handover",
          status: "Pending",
          count: data.stats.awaitingHandover,
        },
        {
          itemName: "In progress",
          status: "InProgress",
          count: data.stats.inProgress,
        },
        {
          itemName: "Completed",
          status: "Completed",
          count: data.stats.delivered,
        },
      ],
    };
  }
}
