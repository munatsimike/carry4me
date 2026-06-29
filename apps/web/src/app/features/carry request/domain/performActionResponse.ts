import type { Role } from "./CreateCarryRequest";
import type { UIActionKey } from "../ui/ActionsMapper";

export type PerformActionResponse = {
  ok: boolean;
  action?: UIActionKey;
  progressed?: boolean;
  waiting_for?: Role;
  reason?: string;
  message?: string;
  notification_id?: string;
  event_type?: string;
  new_status?: string;
  payment_expires_at?: string | null;
};
