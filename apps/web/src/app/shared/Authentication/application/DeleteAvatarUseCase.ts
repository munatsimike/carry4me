import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";

export class DeleteAvatarUseCase {
  repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(
    userId: string,
    path: string,
    bucketName: string = "avatars",
  ): Promise<Result<string>> {
    const result = await this.repo.deleteAvatar(userId, path, bucketName);
    return toResult(result);
  }
}
