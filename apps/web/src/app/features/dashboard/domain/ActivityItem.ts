import type { CarryRequestStatus } from "../../carry request/domain/CreateCarryRequest";

export type ActivityItem = {
  status: CarryRequestStatus;
  count: number;
  itemName: string;
};
