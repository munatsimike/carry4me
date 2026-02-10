import type { HandoverConfirmationState } from "../domain/HandoverConfirmationState";
import type { HandoverConfirmationRepository } from "../domain/HandoverRepository";

export class GetHandoverConfirmationState {
  repo: HandoverConfirmationRepository;

  constructor(repo: HandoverConfirmationRepository) {
    this.repo = repo;
  }

  execute(carryRequestId: string): Promise<HandoverConfirmationState> {
    return this.repo.getState(carryRequestId);
  }
}
