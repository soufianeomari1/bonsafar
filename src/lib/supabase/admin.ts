import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

let admin: SupabaseClient | null = null;

/**
 * Server-only client with SUPABASE_SECRET_KEY: bypasses RLS, for tables that
 * only the server touches (runs, usage). Never import it from client code:
 * serverEnv() throws in the browser.
 */
export function adminClient(): SupabaseClient {
  if (admin) return admin;
  admin = createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return admin;
}
