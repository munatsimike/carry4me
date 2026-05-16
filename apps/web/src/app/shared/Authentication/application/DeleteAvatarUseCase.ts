import type { AuthRepository } from "../domain/AuthRepository";

export class DeleteAvatarUseCase {
  repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(
    userId: string,
    path: string,
    bucketName: string = "avatars",
  ): Promise<string> {
    return await this.repo.deleteAvatar(userId, path, bucketName);
  }
}
