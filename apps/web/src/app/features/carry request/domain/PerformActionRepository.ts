import type { UIActionKey } from "../ui/ActionsMapper";
import type { PerformActionResponse } from "./performActionResponse";

export interface PerformActionRepository {
  performAction(
    action: UIActionKey,
    carryRequestId: string,
  ): Promise<PerformActionResponse>;
}
