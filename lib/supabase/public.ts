import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cookie-free, anonymous Supabase client for PUBLIC reads (published content).
 *
 * Because it never touches request cookies or headers, public pages that use it
 * can be statically generated / ISR-cached instead of being forced dynamic.
 * It uses the anon key, so Row Level Security still applies (anon role sees
 * only published/active rows). Never use it for anything that depends on the
 * signed-in user — use the server client for that.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
