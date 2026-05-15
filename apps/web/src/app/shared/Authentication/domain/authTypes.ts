export type LogoutResult =
  | { success: true }
  | { success: false; error: string };

export type LoginResult = { success: true } | { success: false; error: string };

export type SignupResponse = {};

export type AuthUser = {
  id: string | null;
  email: string;
  password: string;
};

export type UserProfile = {
  id: string | null;
  fullName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  city: string | null;
  phoneNumber: string | null;
  phoneVerified?: boolean;
};

export type AppUser = {
  auth: AuthUser;
  profile: UserProfile;
};

export type SendOTPResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export type VerifyOTPResponse = {
  success: boolean;
  message?: string;
  error?: string;
};
