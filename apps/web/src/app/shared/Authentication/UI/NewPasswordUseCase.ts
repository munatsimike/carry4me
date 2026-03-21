import { toResult } from "../application/toResultMapper";
import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";

export class NewPasswordUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(newPassword: string): Promise<Result<string>> {
    const result = await this.repo.newPassword(newPassword);
    return toResult(result);
  }
}
