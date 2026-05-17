import { AppError } from "@/app/shared/domain/AppError";
import type { AuthRepository } from "../domain/AuthRepository";

export class UpdateAuthDetailsUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async excute(userId: string, email?: string): Promise<string> {
    return await this.repo.updateProfile(userId, this.toUpdateAuthDto(email));
  }

  toUpdateAuthDto(email: string | undefined) {
    const dto: { email?: string } = {};
    if (email) {
      dto.email = email;
    }

    if (Object.keys(dto).length === 0) {
      throw new AppError({
        message: "Email is required",
        code: "VALIDATION_ERROR",
      });
    }
    return dto;
  }
}
