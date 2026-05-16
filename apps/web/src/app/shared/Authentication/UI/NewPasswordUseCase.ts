import type { AuthRepository } from "../domain/AuthRepository";

export class NewPasswordUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(newPassword: string): Promise<string> {
    return await this.repo.newPassword(newPassword);
  }
}
