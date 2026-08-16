// Browser-side Supabase client — safe to use in client components.
// Uses the anon key only; RLS policies (see supabase/schema.sql) enforce
// that a user can only read/write their own rows.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
