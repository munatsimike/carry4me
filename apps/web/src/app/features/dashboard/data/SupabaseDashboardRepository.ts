import { supabase } from "@/app/shared/supabase/client";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";
import type { RequestStats } from "../domain/stats.types";

export class SubabaseDashboardRepository implements DashboardDataRepository {
  async getDashboardStats(userId: string): Promise<RequestStats> {
    const { data } = await supabase
      .rpc("get_dashboard_overview", {
        p_user_id: userId,
      })
      .throwOnError();

    if (!data) {
      // this becomes a "known" error for your modal mapper
      throw { message: "No dashboard data returned", code: "NO_DATA" };
    }

    return {
      stats: {
        postedParcels: data.total_posted_parcels,
        postedTrips: data.total_posted_trips,
        totalMatches: data.total_requests,
        pendingAproval: data.pending_matches,
        awaitingPayment: data.pending_payment,
        awaitingHandover: data.pending_handover,
        inProgress: data.in_transit,
        delivered: data.completed,
      },
    };
  }
}
