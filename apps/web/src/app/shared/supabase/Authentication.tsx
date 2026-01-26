import { supabase } from "./client";

/** Returns user id OR throws if not logged in */
export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error("User not logged in");

  return data.user.id;
}

/** Returns user id OR null (no throwing) */
export async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

/** Returns true/false */
export async function isLoggedIn(): Promise<boolean> {
  const id = await getUserId();
  return Boolean(id);
}
