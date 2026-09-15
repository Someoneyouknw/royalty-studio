"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client. Uses only the public anon key — never the service
 * role key. Row Level Security is what protects data on this client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// A single shared instance for convenience in client components.
let browserClient: ReturnType<typeof createClient> | undefined;
export function getBrowserClient() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}
