
import { SupabaseAuthRepository } from "../data/SupabaseAuthRepository";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "../Authentication/domain/authTypes";
import { supabase } from "@/app/shared/supabase/client";


type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;

  refreshProfile: () => Promise<void>;
};
const authRepository = new SupabaseAuthRepository();

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data, error } = await authRepository.fetchUserProfile(userId);
    if (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as any).message)
          : "Unknown error";

      setError(message);
      // If profile row doesn't exist yet, you can decide to treat it as null
      setProfile(null);
    } else {
      setProfile(data);
    }
    setProfile(data ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      }

      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          await fetchProfile(sessionUser.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        error,
        user,
        loading,
        profile,

        refreshProfile: async () => {
          if (user) await fetchProfile(user.id);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
