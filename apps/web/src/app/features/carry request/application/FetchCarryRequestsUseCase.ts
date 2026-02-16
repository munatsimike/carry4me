import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { CarryRequest } from "../domain/CarryRequest";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class FetchCarryRequestsUseCase {
  repo: CarryRequestRepository;
  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(loggedInUserId: string): Promise<Result<CarryRequest[]>> {
    const result = await this.repo.fetchCarryRequestsForUser(loggedInUserId);
    return toResult(result)
  }
}
