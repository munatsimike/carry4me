import type { PerformActionRepository } from "../domain/PerformActionRepository";

import { type UIActionKey } from "../ui/ActionsMapper";

export class PerformCarryRequestActionUseCase {
  performActionRepo: PerformActionRepository;
  constructor(performActionRepo: PerformActionRepository) {
    this.performActionRepo = performActionRepo;
  }

  async execute(action: UIActionKey, carryRequestId: string) {
    const result = await this.performActionRepo.performAction(
      action,
      carryRequestId,
    );

    return result;
  }
}
