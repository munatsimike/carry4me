import { supabase } from "@/app/shared/supabase/client";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import type { CarryRequest } from "../domain/CarryRequest";

export class SupabaseCarryRequestRepository implements CarryRequestRepository {
  async createCarryRequest(request: CarryRequest): Promise<string> {
    const { data } = await supabase
      .from("carry_requests")
      .insert({
        parcel_id: request.parcel_id,
        trip_id: request.trip_id,
        sender_user_id: request.sender_user_id,
        traveler_user_id: request.traveler_user_id,
        initiator_role: request.initiator_role,
        status: request.status,
        parcel_snapshot: request.parcel_snapshot,
        trip_snapshot: request.trip_snapshot,
      })
      .select("id")
      .single()
      .throwOnError();
    return data.id;
  }
}
