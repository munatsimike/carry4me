import type { Role } from "./CreateCarryRequest";
import type { UIActionKey } from "../ui/ActionsMapper";

export type PerformActionResponse = {
  ok: boolean;
  action?: UIActionKey;
  progressed?: boolean;
  waiting_for?: Role;
  reason?: string;
  notification_id?: string;
  event_type?: string;
  new_status?: string;
  current_status_in_db?: string;
  expected_status?: string;
  request_id_received?: string;
  action_key_received?: string;
  actor_user_id?: string;
};
