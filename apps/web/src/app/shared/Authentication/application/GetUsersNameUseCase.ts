import type { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import type { UserProfile } from "../domain/authTypes";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class GetUsersNameUseCase {
  repo: SupabaseAuthRepository;

  constructor(repo: SupabaseAuthRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<Result<UserProfile>> {
    const result = await this.repo.fetchUserProfile(userId);
    return toResult(result);
  }
}
