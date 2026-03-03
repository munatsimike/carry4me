export type LogoutResult =
  | { success: true }
  | { success: false; error: string };

export type LoginResult =
  | { success: true;}
  | { success: false; error: string };

  export type SignupResponse ={
    
  }

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
};

export type AppUser = {
  auth: AuthUser;
  profile: UserProfile;
};
