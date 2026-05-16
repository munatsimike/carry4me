import { supabase } from "@/app/shared/supabase/client";
import { requireData, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import {
  type CarryRequestStatus,
  type CreateCarryRequest,
} from "../domain/CreateCarryRequest";
import { toCarryRequestMapper } from "../domain/toCarryRequestMapper";
import type { CarryRequest } from "../domain/CarryRequest";

export class SupabaseCarryRequestRepository implements CarryRequestRepository {
  async updateCarryRequestStatus(
    carryRequestId: string,
    newStatus: CarryRequestStatus,
  ): Promise<string> {
    const { data, status, error } = await supabase
      .from("carry_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carryRequestId)
      .select("id")
      .single();

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }

  async isExpired(requestId: string): Promise<boolean> {
    const { data, error, status } = await supabase.rpc(
      "perform_carry_request_action",
      {
        request_id: requestId,
        action_key: "PAY",
      },
    );

    throwIfSupabaseError(error, status);

    if (!data.ok && data.reason === "PAYMENT_EXPIRED") {
      return false;
    }

    return true;
  }

  async fetchCarryRequestsForUser(userId: string): Promise<CarryRequest[]> {
    const { error: expireError } = await supabase.rpc(
      "expire_overdue_carry_requests",
    );

    throwIfSupabaseError(expireError);

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

    throwIfSupabaseError(error, status);

    return (data ?? []).map(toCarryRequestMapper);
  }

  async createCarryRequest(request: CreateCarryRequest): Promise<string> {
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

    throwIfSupabaseError(error, status);

    return requireData(data).id;
  }
}
