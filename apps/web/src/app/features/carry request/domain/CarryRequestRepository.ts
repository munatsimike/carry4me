
import type { CarryRequest } from "./CarryRequest";
import type {  CarryRequestStatus, CreateCarryRequest, Role } from "./CreateCarryRequest";

export interface CarryRequestRepository {
  createCarryRequest(request: CreateCarryRequest): Promise<string>;
  fetchCarryRequestsForUser(
    loggedInUserId: string,
  ): Promise<CarryRequest[]>;

   updateCarryRequestStatus(
  carryRequestId: string,
  newStatus: CarryRequestStatus
): Promise<void>
}
