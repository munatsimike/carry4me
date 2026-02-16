import { supabase } from "@/app/shared/supabase/client";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";
import type { RequestStats } from "../domain/stats.types";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export class SubabaseDashboardRepository implements DashboardDataRepository {
  async getDashboardStats(userId: string): Promise<RepoResponse<RequestStats>> {
    const { data, status, error } = await supabase.rpc(
      "get_dashboard_overview",
      {
        p_user_id: userId,
      },
    );

    if (error) {
      return { data: null, status: status, error: error };
    }

    return {
      data: {
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
      },
      error: null,
      status: null,
    };
  }
}
