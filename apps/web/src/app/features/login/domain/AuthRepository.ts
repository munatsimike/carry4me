
export type User = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
};

export type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string };

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResult>;
}
