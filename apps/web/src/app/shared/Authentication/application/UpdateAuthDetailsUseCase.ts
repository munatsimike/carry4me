import { AppError } from "@/app/shared/domain/AppError";
import type { AuthRepository } from "../domain/AuthRepository";
import type { UpdateProfileDto } from "./updateProfileDTO";

export class UpdateAuthDetailsUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async excute(
    userId: string,
    email?: string,
    phoneNumber?: string,
  ): Promise<string> {
    return await this.repo.updateProfile(
      userId,
      this.toUpdateAuthDto(email, phoneNumber),
    );
  }

  toUpdateAuthDto(
    email: string | undefined,
    phoneNumber: string | undefined,
  ): Partial<UpdateProfileDto> {
    const dto: Partial<UpdateProfileDto> = {};
    if (email) {
      dto.email = email;
    }
    if (phoneNumber) {
      dto.phone_number = phoneNumber;
    }

    if (Object.keys(dto).length === 0) {
      throw new AppError({
        message: "Email or phone number is required",
        code: "VALIDATION_ERROR",
      });
    }
    return dto;
  }
}
