import type { CarryRequest } from "./CarryRequest";

export interface CarryRequestRepository {
  createCarryRequest(request: CarryRequest): Promise<string>;
}
