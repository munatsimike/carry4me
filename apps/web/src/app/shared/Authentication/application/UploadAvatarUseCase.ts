import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class UploadAvatarUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(userId: string, file: File): Promise<Result<string>> {
    const filePath = await this.repo.uploadAvatar(file, userId);

    return toResult(filePath);
  }
}
