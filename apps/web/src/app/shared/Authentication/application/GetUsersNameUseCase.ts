import type { SupabaseAuthRepository } from "../../data/LoginRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class GetUsersNameUseCase {
  repo: SupabaseAuthRepository;

  constructor(repo: SupabaseAuthRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<string>> {
    const result = await this.repo.fetchUserName(userId);
    return toResult(result);
  }
}
