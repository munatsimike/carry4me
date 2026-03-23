import type { User } from "@supabase/supabase-js";
import type { RepoResponse } from "../../domain/RepoResponse";
import type { UpdateAuthDto } from "../application/UpdateAuthDto";
import type { UpdateProfileDto } from "../application/updateProfileDTO";
import type {
  AppUser,
  UserProfile,
} from "./authTypes";

export interface AuthRepository {
  login(email: string, password: string): Promise<RepoResponse<User>>;
  logout(): Promise<RepoResponse<boolean>>;
  fetchUserProfile(userId: string): Promise<RepoResponse<UserProfile>>;
  signUp(user: AppUser): Promise<RepoResponse<string>>;
  uploadAvatar(file: File, userId: string): Promise<RepoResponse<string>>;
  deleteAvatar(
    userId: string,
    path: string,
    bucketName: string,
  ): Promise<RepoResponse<string>>;
  updateProfile(
    userId: string,
    updateProfile: Partial<UpdateProfileDto>,
  ): Promise<RepoResponse<string>>;

  resetPassword(email:string):Promise<RepoResponse<string>>
  newPassword(password:string):Promise<RepoResponse<string>>

  updateAuthDetails(
    updateAuthDto: Partial<UpdateAuthDto>,
  ): Promise<RepoResponse<string>>;
}
