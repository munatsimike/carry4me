import type { User } from "@supabase/supabase-js";
import type { UpdateAuthDto } from "../application/UpdateAuthDto";
import type { UpdateProfileDto } from "../application/updateProfileDTO";
import type { AppUser, UserProfile } from "./authTypes";

export interface AuthRepository {
  logout(): Promise<boolean>;
  fetchUserProfile(userId: string): Promise<UserProfile | null>;
  completeProfile(user: AppUser): Promise<string>;
  uploadAvatar(file: File, userId: string): Promise<string>;
  deleteAvatar(
    userId: string,
    path: string,
    bucketName: string,
  ): Promise<string>;
  updateProfile(
    userId: string,
    updateProfile: Partial<UpdateProfileDto>,
  ): Promise<string>;

  updateAuthDetails(
    updateAuthDto: Partial<UpdateAuthDto>,
  ): Promise<string>;

  // Phone Verification Methods
  sendPhoneOTP(phoneNumber: string): Promise<string>;
  verifyPhoneOTP(
    phoneNumber: string,
    token: string,
  ): Promise<User>;
  requestPhoneChange(phoneNumber: string): Promise<string>;
  verifyPhoneChange(
    userId: string,
    phoneNumber: string,
    token: string,
    profileCountry: string | null,
  ): Promise<string>;
}
