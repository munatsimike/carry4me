import type { CarryRequestEvent } from "../domain/CarryRequestEvent";
import type { CarryRequestEventRepository } from "../domain/CarryRequestEvents";

export class CreateCarryRequestEventUseCase {
  repo: CarryRequestEventRepository;
  constructor(repo: CarryRequestEventRepository) {
    this.repo = repo;
  }

  async execute(requestEvent: CarryRequestEvent): Promise<string> {
    return this.repo.createCarryRequestEvent(requestEvent);
  }
}
