import type { Role } from "../../domain/CreateCarryRequest";


export type HandoverConfirmationRow = {
  carry_request_id: string;
  user_id: string;
  role: Role;
  confirmed_at: string;
};