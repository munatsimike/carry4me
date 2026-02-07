import type { CarryRequest } from "../domain/CarryRequest";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";

export class FetchCarryRequestsUseCase {
  repo: CarryRequestRepository;
  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(loggedInUserId: string): Promise<CarryRequest[]> {
    return this.repo.fetchCarryRequestsForUser(loggedInUserId);
  }
}
