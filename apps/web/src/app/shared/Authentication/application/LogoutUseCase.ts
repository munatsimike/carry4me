
import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class LogoutUseCase {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(): Promise<Result<boolean>> {
    const result = await this.repo.logout();
    return toResult(result)
  }
}
