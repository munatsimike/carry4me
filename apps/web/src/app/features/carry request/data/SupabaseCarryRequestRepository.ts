import { supabase } from "@/app/shared/supabase/client";
import { requireData, throwIfSupabaseError } from "@/app/shared/domain/AppError";
import type {
  CarryRequestRepository,
  EndedRequestBetweenParties,
} from "../domain/CarryRequestRepository";
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

  async isPaymentExpired(requestId: string): Promise<boolean> {
    const { data, error, status } = await supabase
      .from("carry_requests")
      .select("status, payment_expires_at")
      .eq("id", requestId)
      .maybeSingle();

    throwIfSupabaseError(error, status);

    // Treat missing/non-payable requests as unavailable so UI won't open payment modal
    // and then fail with create-payment-intent 404/invalid-status errors.
    if (!data || data.status !== "PENDING_PAYMENT") {
      return true;
    }

    if (!data.payment_expires_at) {
      return false;
    }

    return new Date(data.payment_expires_at).getTime() <= Date.now();
  }

  async fetchCarryRequestsForUser(userId: string): Promise<CarryRequest[]> {
    const { error: expireError } = await supabase.rpc(
      "expire_overdue_carry_requests",
    );

    if (expireError) {
      console.error("expire_overdue_carry_requests failed:", expireError);
    }

    const { data, status, error } = await supabase
      .from("carry_requests")
      .select(
        `
        id,
        parcel_id,
        trip_id,
        sender_user_id,
        traveler_user_id,
        initiator_role,
        status,
        parcel_snapshot,
        trip_snapshot,
        payment_expires_at,
        expired_at,
        created_at,
        updated_at,
        stripe_payment_intent_id,
        payment_status,
        delivery_otp_expires_at,
        delivery_otp_attempts,
        delivery_otp_verified_at,
        delivery_otp_last_sent_at,
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
        "EXPIRED",
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

  async findLatestEndedRequestBetweenParties(
    senderUserId: string,
    travelerUserId: string,
  ): Promise<EndedRequestBetweenParties | null> {
    const { data, status, error } = await supabase
      .from("carry_requests")
      .select(
        `
        status,
        events:carry_request_events(type, actor_user_id, created_at)
      `,
      )
      .eq("sender_user_id", senderUserId)
      .eq("traveler_user_id", travelerUserId)
      .in("status", ["REJECTED", "CANCELLED", "EXPIRED"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<{
        status: "REJECTED" | "CANCELLED" | "EXPIRED";
        events: Array<{
          type: string;
          actor_user_id: string | null;
          created_at: string;
        }> | null;
      }>();

    throwIfSupabaseError(error, status);

    if (!data?.status) {
      return null;
    }

    const terminalEventType =
      data.status === "REJECTED"
        ? "REQUEST_REJECTED"
        : data.status === "CANCELLED"
          ? "REQUEST_CANCELED"
          : "REQUEST_EXPIRED";

    const terminalEvent = (data.events ?? [])
      .filter((event) => event.type === terminalEventType)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

    return {
      status: data.status,
      endedByUserId: terminalEvent?.actor_user_id ?? null,
    };
  }
}
