import { supabase } from "@/app/shared/supabase/client";
import type { PerformActionResponse } from "../domain/performActionResponse";
import type { PerformActionRepository } from "../domain/PerformActionRepository";
import type { UIActionKey } from "../ui/ActionsMapper";

export class SupabasePerformActionRepository implements PerformActionRepository {
  async performAction(
    action: UIActionKey,
    carryRequestId: string,
  ): Promise<PerformActionResponse> {
    const { data } = await supabase
      .rpc("perform_carry_request_action", {
        request_id: carryRequestId,
        action_key: action,
      })
      .throwOnError();
    return data as PerformActionResponse;
  }
}
