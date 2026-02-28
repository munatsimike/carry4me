import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "../Authentication/domain/authTypes";
import { SupabaseAuthRepository } from "../data/SupabaseAuthRepository";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "./client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
};

const authRepository = new SupabaseAuthRepository();
const AuthContext = createContext<AuthContextValue | null>(null);

function toErrorMessage(err: unknown) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in (err as any)) return String((err as any).message);
  return String(err);
}

function isNoRowError(err: unknown) {
  const code = (err as any)?.code;
  const msg = (err as any)?.message;
  return (
    code === "PGRST116" ||
    (typeof msg === "string" && msg.toLowerCase().includes("0 rows"))
  );
}

async function withTimeout<T>(promise: Promise<T>, ms = 10_000): Promise<T> {
  let timeoutId: number | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("Request timed out")), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent setState after unmount
  const mountedRef = useRef(true);

  // Prevent race conditions (stale requests overwriting newer results)
  const requestIdRef = useRef(0);

  const fetchProfile = useCallback(async (userId: string) => {
    const myRequestId = ++requestIdRef.current;

    try {
      // ✅ Timeout protects against "loading forever"
      const { data, error } = await withTimeout(authRepository.fetchUserProfile(userId), 10_000);

      // Ignore stale results / unmounted
      if (!mountedRef.current || myRequestId !== requestIdRef.current) return;

      if (error) {
        if (isNoRowError(error)) {
          setProfile(null);
          setError(null);
          return;
        }

        setError(toErrorMessage(error));
        setProfile(null);
        return;
      }

      setError(null);
      setProfile(data ?? null);
    } catch (e) {
      if (!mountedRef.current || myRequestId !== requestIdRef.current) return;
      setError(toErrorMessage(e));
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          setError(error.message);
          setUser(null);
          setProfile(null);
          return;
        }

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          await fetchProfile(sessionUser.id);
        } else {
          // cancel/ignore any in-flight profile request
          requestIdRef.current++;
          setProfile(null);
          setError(null);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!mountedRef.current) return;

        setLoading(true);
        try {
          const sessionUser = session?.user ?? null;
          setUser(sessionUser);

          if (sessionUser) {
            await fetchProfile(sessionUser.id);
          } else {
            requestIdRef.current++;
            setProfile(null);
            setError(null);
          }
        } finally {
          if (mountedRef.current) setLoading(false);
        }
      })();
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    const userId = user?.id; // snapshot
    if (!userId) return;

    setLoading(true);
    try {
      await fetchProfile(userId);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, error, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}