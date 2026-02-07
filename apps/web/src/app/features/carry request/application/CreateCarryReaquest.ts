import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import type { CreateCarryRequest } from "../domain/CreateCarryRequest";

export class CreateCarryRequestUseCase {
  repo: CarryRequestRepository;

  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(input: CreateCarryRequest): Promise<string> {
    return await this.repo.createCarryRequest(input);
  }
}
