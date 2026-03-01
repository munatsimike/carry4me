import type { RepoResponse } from "../../domain/RepoResponse";
import type { UpdateProfileDto } from "../application/updateProfileDTO";
import type { AppUser, LoginResult, LogoutResult, UserProfile } from "./authTypes";

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResult>;
  logout(): Promise<LogoutResult>;
  fetchUserProfile(userId: string): Promise<RepoResponse<UserProfile>>;
  signUp(user: AppUser): Promise<RepoResponse<string>>;
  uploadAvatar(file: File, userId: string): Promise<RepoResponse<string>>;
  updateProfile(
      userId: string,
      updateProfile: Partial<UpdateProfileDto>,
    ): Promise<RepoResponse<string>>
}
