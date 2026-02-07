import type { CarryRequest } from "./CarryRequest";
import type {  CreateCarryRequest, Role } from "./CreateCarryRequest";

export interface CarryRequestRepository {
  createCarryRequest(request: CreateCarryRequest): Promise<string>;
  fetchCarryRequestsForUser(
    loggedInUserId: string,
  ): Promise<CarryRequest[]>;
}
