import type { AuthRepository } from "../domain/AuthRepository";

export class LogoutUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(): Promise<boolean> {
    return await this.repo.logout();
  }
}
