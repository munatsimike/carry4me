import type { HandoverConfirmationRow } from "./HandoverConfirmation";
import type { HandoverConfirmationState } from "./HandoverConfirmationState";

export interface HandoverConfirmationRepository {
  getState(carryRequestId: string): Promise<HandoverConfirmationState>;
  fetchConfirmations(
    carryRequestId: string,
  ): Promise<HandoverConfirmationRow[]>;
}
