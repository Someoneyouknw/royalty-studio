import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Privileged Supabase client using the SERVICE ROLE key. This BYPASSES Row
 * Level Security, so it must ONLY ever run on the server (the `server-only`
 * import guarantees a build error if it is imported into a client bundle).
 *
 * Use it for trusted server-side work such as deleting objects from Storage
 * after an authorization check has already passed. Never expose it to the
 * browser and never use it as a shortcut around an auth check.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
