import type { Role } from "./CreateCarryRequest";
import type { UIActionKey } from "../ui/ActionsMapper";

export type PerformActionResponse = {
  ok: boolean;
  action: UIActionKey;
  progressed: boolean;
  waiting_for: Role;
};
