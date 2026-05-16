import type { AuthRepository } from "../domain/AuthRepository";

export class ResetPasswordUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(email: string): Promise<string> {
    return await this.repo.resetPassword(email);
  }
}
