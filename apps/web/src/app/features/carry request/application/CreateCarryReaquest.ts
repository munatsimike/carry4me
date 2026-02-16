import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import type { CreateCarryRequest } from "../domain/CreateCarryRequest";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class CreateCarryRequestUseCase {
  repo: CarryRequestRepository;

  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(input: CreateCarryRequest): Promise<Result<string>> {
    const result = await this.repo.createCarryRequest(input);
    return toResult(result);
  }
}
