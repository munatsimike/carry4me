import type { AuthRepository } from "../domain/AuthRepository";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";
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
  ): Promise<Result<string>> {
    
    const result = await this.repo.updateProfile(
      userId,
      this.toUpdateAuthDto(email, phoneNumber),
    );
    return toResult(result);
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

    if (Object.keys(dto).length === 0) throw Error;
    return dto;
  }
}
