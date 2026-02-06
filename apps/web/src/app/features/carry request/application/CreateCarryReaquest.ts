import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import type { CarryRequest } from "../domain/CarryRequest";

export class CreateCarryRequest {
  repo: CarryRequestRepository;

  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(input: CarryRequest): Promise<string> {
    return await this.repo.createCarryRequest(input);
  }
}
