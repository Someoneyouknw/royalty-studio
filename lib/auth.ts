import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** The authenticated user + their profile, or null if signed out. */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string | null;
  profile: Profile | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { id: user.id, email: user.email ?? null, profile };
}

/** True when the current user has an admin (or staff) profile role. */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.profile) return false;
  return user.profile.role === "admin" || user.profile.role === "staff";
}

/**
 * Throws when the caller is not an authorised admin. Use inside API route
 * handlers to enforce server-side authorization (never rely on the UI hiding).
 * Returns the user id when authorised.
 */
export async function requireAdmin(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("You must be signed in.", 401);
  }
  const role = user.profile?.role;
  if (role !== "admin" && role !== "staff") {
    throw new AuthError("You are not authorised to perform this action.", 403);
  }
  return { id: user.id };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
