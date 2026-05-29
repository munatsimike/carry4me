import type { AuthRepository } from "../domain/AuthRepository";

export class DeleteAccountUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(): Promise<void> {
    await this.repo.deleteAccount();
  }
}
