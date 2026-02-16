
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { CarryRequest } from "./CarryRequest";
import type {  CarryRequestStatus, CreateCarryRequest, Role } from "./CreateCarryRequest";

export interface CarryRequestRepository {
  createCarryRequest(request: CreateCarryRequest): Promise<RepoResponse<string>>;
  fetchCarryRequestsForUser(
    loggedInUserId: string,
  ): Promise<RepoResponse<CarryRequest[]>>;

   updateCarryRequestStatus(
  carryRequestId: string,
  newStatus: CarryRequestStatus
): Promise<RepoResponse<string>>
}
