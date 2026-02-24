import type { AuthRepository } from "../domain/AuthRepository";
import type { LogoutResult } from "../domain/authTypes";

export class LogoutUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(): Promise<LogoutResult> {
    return this.repo.logout();
  }
}
