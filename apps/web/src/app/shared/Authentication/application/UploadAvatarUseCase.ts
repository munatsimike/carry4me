import type { AuthRepository } from "../domain/AuthRepository";

export class UploadAvatarUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(userId: string, file: File): Promise<string> {
    return await this.repo.uploadAvatar(file, userId);
  }
}
