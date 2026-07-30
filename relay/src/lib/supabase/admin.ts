// Service-role Supabase client. Bypasses RLS entirely.
// ONLY use this in trusted server code: substitute-facing routes
// (relay pack lookup by token, handover submission) and background jobs.
// NEVER import this into a client component or expose it to the browser.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
