import type { AuthRepository } from "../domain/AuthRepository";
import type { AppUser } from "../domain/authTypes";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class SignUpUseCase {
  repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(appUser: AppUser): Promise<Result<string>> {
    const result = await this.repo.signUp(appUser);
    return toResult(result);
  }

  async uploadAvatar(userId: string, file: File): Promise<Result<string>> {
    const result = await this.repo.uploadAvatar(file, userId);
    return toResult(result);
  }
}
