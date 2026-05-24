import { supabase } from "@/app/shared/supabase/client";
import {
  requireData,
  throwIfSupabaseError,
} from "@/app/shared/domain/AppError";
import type { PerformActionResponse } from "../domain/performActionResponse";
import type { PerformActionRepository } from "../domain/PerformActionRepository";
import type { UIActionKey } from "../ui/ActionsMapper";

export class SupabasePerformActionRepository implements PerformActionRepository {
  async performAction(
    actionKey: UIActionKey,
    carryRequestId: string,
  ): Promise<PerformActionResponse> {
    const { data, error, status } = await supabase.rpc(
      "perform_carry_request_action",
      {
        request_id: carryRequestId,
        action_key: actionKey,
      },
    );

    throwIfSupabaseError(error, status);

    return requireData(data) as PerformActionResponse;
  }
}
