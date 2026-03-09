import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { CarryRequest } from "../domain/CarryRequest";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { SelectedTab } from "../ui/CarryRequestsPage";
import { toRequestStatus } from "../domain/toRequestStatus";

export class FetchCarryRequestsUseCase {
  repo: CarryRequestRepository;
  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(
    loggedInUserId: string,
    selectedTab: SelectedTab,
  ): Promise<Result<CarryRequest[]>> {
    const result = await this.repo.fetchCarryRequestsForUser(loggedInUserId, toRequestStatus(selectedTab));
    return toResult(result);

  }
}
