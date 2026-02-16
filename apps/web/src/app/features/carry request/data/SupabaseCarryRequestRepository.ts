import { supabase } from "@/app/shared/supabase/client";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import {
  type CarryRequestStatus,
  type CreateCarryRequest,
} from "../domain/CreateCarryRequest";
import { toCarryRequestMapper } from "../domain/toCarryRequestMapper";
import type { CarryRequest } from "../domain/CarryRequest";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";

export class SupabaseCarryRequestRepository implements CarryRequestRepository {
  async updateCarryRequestStatus(
    carryRequestId: string,
    newStatus: CarryRequestStatus,
  ): Promise<RepoResponse<string>> {
    const { data, status, error } = await supabase
      .from("carry_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carryRequestId)
      .select("id")
      .single();
    if (error) return { data: null, status, error };
    return { data: data.id, error: null, status: null };
  }

  async fetchCarryRequestsForUser(
    userId: string,
  ): Promise<RepoResponse<CarryRequest[]>> {
    const { data, status, error } = await supabase
      .from("carry_requests")
      .select(
        `
        *,
        events:carry_request_events(*),
        handover_confirmations:carry_request_handover_confirmations(role, confirmed_at)
      `,
      )
      .or(`sender_user_id.eq.${userId},traveler_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) return { data: null, status, error };
    const result = (data ?? []).map(toCarryRequestMapper);
    return { data: result, error: null, status: null };
  }

  async createCarryRequest(
    request: CreateCarryRequest,
  ): Promise<RepoResponse<string>> {
    const { data, status, error } = await supabase
      .from("carry_requests")
      .insert({
        parcel_id: request.parcelId,
        trip_id: request.tripId,
        sender_user_id: request.senderUserId,
        traveler_user_id: request.travelerUserId,
        initiator_role: request.initiatorRole,
        status: request.status,
        parcel_snapshot: request.parcelSnapshot,
        trip_snapshot: request.tripSnapshot,
      })
      .select("id")
      .single();
    if (error) return { data: null, status, error };
    return { data: data.id, error: null, status: null };
  }
}
