import { supabase } from "@/app/shared/supabase/client";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import { type CreateCarryRequest } from "../domain/CreateCarryRequest";
import { toCarryRequestMapper } from "../domain/toCarryRequestMapper";
import type { CarryRequest } from "../domain/CarryRequest";

export class SupabaseCarryRequestRepository implements CarryRequestRepository {
  async fetchCarryRequestsForUser(userId: string): Promise<CarryRequest[]> {
    const { data } = await supabase
      .from("carry_requests")
      .select(
        `
      *,
      events:carry_request_events(*)
    `,
      )
      .or(`sender_user_id.eq.${userId},traveler_user_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .throwOnError();

    return (data ?? []).map(toCarryRequestMapper);
  }

  async createCarryRequest(request: CreateCarryRequest): Promise<string> {
    const { data } = await supabase
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
      .single()
      .throwOnError();
    return data.id;
  }
}
