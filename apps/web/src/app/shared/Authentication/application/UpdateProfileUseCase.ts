import type { AuthRepository } from "../domain/AuthRepository";
import type { UserProfile } from "../domain/authTypes";
import type { UpdateProfileDto } from "./updateProfileDTO";

export class UpdateProfileUseCase {
  repo: AuthRepository;
  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  async execute(
    userId: string,
    updateProfile: UserProfile,
  ): Promise<string> {
    return await this.repo.updateProfile(
      userId,
      toUpdateProfileDto(updateProfile),
    );
  }
}

function toUpdateProfileDto(profile: UserProfile): Partial<UpdateProfileDto> {
  return {
    full_name: profile.fullName ?? "",
    city: profile.city ?? "",
    country_code: profile.countryCode ?? "",
    phone_number: profile.phoneNumber ?? "",
  };
}
