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
    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    return { data: data.id, error: null };
  }

  async isExpired(requestId: string): Promise<RepoResponse<boolean>> {
    const { data, error, status } = await supabase.rpc(
      "perform_carry_request_action",
      {
        request_id: requestId,
        action_key: "PAY",
      },
    );

    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };

    if (!data.ok && data.reason === "PAYMENT_EXPIRED") {
      return { data: false, error: error };
    }

    return { data: true, error: error };
  }

  async fetchCarryRequestsForUser(
    userId: string,
  ): Promise<RepoResponse<CarryRequest[]>> {
    const { error: isExpiredErrors } = await supabase.rpc(
      "expire_overdue_carry_requests",
    );

    if (isExpiredErrors) return { data: null, error: isExpiredErrors };

    const { data, status, error } = await supabase
      .from("carry_requests")
      .select(
        `
        *,
        events:carry_request_events(*),
        handover_confirmations:carry_request_handover_confirmations(role, confirmed_at)
      `,
      )
      .in("status", [
        "PENDING_ACCEPTANCE",
        "PENDING_PAYMENT",
        "PENDING_HANDOVER",
        "IN_TRANSIT",
        "PENDING_PAYOUT",
        "PAID_OUT",
        "REJECTED",
        "CANCELLED",
      ])
      .or(`sender_user_id.eq.${userId},traveler_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    const result = (data ?? []).map(toCarryRequestMapper);

    return { data: result, error: null };
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
    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    return { data: data.id, error: null };
  }
}
