import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import type { CarryRequestStatus } from "../domain/CreateCarryRequest";

export class UpdateCarryRequestUseCase {
  repo: CarryRequestRepository;
  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(requestId: string, status: CarryRequestStatus): Promise<void> {
    return this.repo.updateCarryRequestStatus(requestId, status);
  }
}
