import type { AuthRepository, LogoutResult } from "../domain/AuthRepository";

export class LogoutUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(): Promise<LogoutResult> {
   return this.repo.logout();
  }
}
