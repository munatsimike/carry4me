import type { AuthRepository } from "../domain/AuthRepository";

export class LoginUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(email: string, password: string) {
    return this.repo.login(email, password);
  }
}
