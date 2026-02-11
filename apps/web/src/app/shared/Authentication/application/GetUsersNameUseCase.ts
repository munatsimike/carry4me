import type { SupabaseAuthRepository } from "../../data/LoginRepository";

export class GetUsersNameUseCase {
  repo: SupabaseAuthRepository;

  constructor(repo: SupabaseAuthRepository) {
    this.repo = repo;
  }

  execute(userId: string): Promise<string> {
    return this.repo.fetchUserName(userId);
  }
}
