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
  const dto: Partial<UpdateProfileDto> = {
    full_name: normalizeFullName(profile.fullName),
    city: profile.city ?? "",
    country_code: profile.countryCode ?? "",
  };

  return dto;
}

function normalizeFullName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "";

  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
