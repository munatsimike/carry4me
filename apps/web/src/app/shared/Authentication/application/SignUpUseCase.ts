import type { AuthRepository } from "../domain/AuthRepository";
import type { AppUser } from "../domain/authTypes";

export class SignUpUseCase {
  repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(appUser: AppUser): Promise<string> {
    return await this.repo.completeProfile(appUser);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    return await this.repo.uploadAvatar(file, userId);
  }
}
