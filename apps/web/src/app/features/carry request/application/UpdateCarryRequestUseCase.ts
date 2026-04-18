import type { CarryRequestRepository } from "../domain/CarryRequestRepository";


export class UpdateCarryRequestUseCase {
  repo: CarryRequestRepository;
  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

// / **async execute(requestId: string, status: CarryRequestStatus): Promise<string> {
    // return this.repo.updateCarryRequestStatus(requestId, status);
  // }**/
}
