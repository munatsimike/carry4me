// userMapper.ts
import type { User as SbUser } from "@supabase/supabase-js";
import type { User } from "../domain/AuthRepository";

export default function toDomainUser(u: SbUser): User {
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.user_metadata?.full_name,
    avatarUrl: u.user_metadata?.avatar_url,
  };
}
