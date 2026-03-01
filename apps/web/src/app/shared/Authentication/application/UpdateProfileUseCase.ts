import type { AuthRepository } from "../domain/AuthRepository";
import type { UserProfile } from "../domain/authTypes";
import type { Result } from "../domain/Result";
import { toResult } from "./toResultMapper";
import type { UpdateProfileDto } from "./updateProfileDTO";

export class UpdateProfileUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(
    userId: string,
    updateProfile: UserProfile,
  ): Promise<Result<string>> {
    const result = await this.repo.updateProfile(
      userId,
      toUpdateProfileDto(updateProfile),
    );
    return toResult(result);
  }
}

function toUpdateProfileDto(profile: UserProfile): Partial<UpdateProfileDto> {
  return {
    full_name: profile.fullName ?? "",
    city: profile.city ?? "",
    country_code: profile.countryCode ?? ""
  };
}
