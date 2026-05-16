import { supabase } from "@/app/shared/supabase/client";
import { requireData, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type { DashboardDataRepository } from "../domain/DashBoardRepository";
import type { RequestStats } from "../domain/stats.types";

export class SubabaseDashboardRepository implements DashboardDataRepository {
  async getDashboardStats(userId: string): Promise<RequestStats> {
    const { data, error } = await supabase.rpc("get_dashboard_overview", {
      p_user_id: userId,
    });

    throwIfSupabaseError(error);

    const overview = requireData(data);

    return {
      stats: {
        postedParcels: overview.total_posted_parcels,
        postedTrips: overview.total_posted_trips,
        activeRequests: overview.active_requests,
        pendingAproval: overview.pending_matches,
        awaitingPayment: overview.pending_payment,
        awaitingHandover: overview.pending_handover,
        inProgress: overview.in_transit,
        delivered: overview.completed,
      },
    };
  }
}
