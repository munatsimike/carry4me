export type User = {
  id: string;
  fullName: string;
  avatarUrl?: string;
};
export type LogoutResult =
  | { success: true }
  | { success: false; error: string };

export type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string };

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResult>;
  logout(): Promise<LogoutResult>;
}
