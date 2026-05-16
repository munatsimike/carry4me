import type { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import type { UserProfile } from "../domain/authTypes";

export class GetUsersNameUseCase {
  repo: SupabaseAuthRepository;

  constructor(repo: SupabaseAuthRepository) {
    this.repo = repo;
  }

  async execute(userId: string): Promise<UserProfile | null> {
    return await this.repo.fetchUserProfile(userId);
  }
}
