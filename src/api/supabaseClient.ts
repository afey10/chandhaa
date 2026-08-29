import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Create a .env.local file from .env.example and set the Supabase values before running the app."
  );
}

// This is the publishable/anon key: safe to ship in the built frontend.
// Every table has RLS enabled with no policies, so this key alone grants
// zero direct table access. All reads/writes go through the RPC functions
// in api/rpc.ts, each of which validates the session token server-side.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default supabase;
