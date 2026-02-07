import { ROLES, type Role } from "../domain/CreateCarryRequest";

export const toRoleMapper: Record<string, Role> = {
  sender: ROLES.SENDER,
  traveler: ROLES.TRAVELER,
};
