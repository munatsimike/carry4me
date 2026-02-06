import { supabase } from "@/app/shared/supabase/client";
import type { CarryRequestEvent } from "../domain/CarryRequestEvent";
import type { CarryRequestEventRepository } from "../domain/CarryRequestEvents";

export class SupabaseCarryRequestEventRepository implements CarryRequestEventRepository {
  async createCarryRequestEvent(
    requestEvent: CarryRequestEvent,
  ): Promise<string> {
    const { data } = await supabase
      .from("carry_request_events")
      .insert({
        carry_request_id: requestEvent.carryRequestId,
        type: requestEvent.type,
        actor_user_id: requestEvent.actorUserId,
        metadata: requestEvent.metadata,
      })
      .select("id")
      .single()
      .throwOnError();

    return data.id;
  }
}
