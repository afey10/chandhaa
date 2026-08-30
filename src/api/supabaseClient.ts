import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Do not throw during module loading when Vercel environment variables are
// missing. A module-level exception produces a completely blank page. The
// login/API layer can report the configuration problem instead.
if (!url || !anonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add both variables in Vercel Project Settings → Environment Variables and redeploy."
  );
}

// This is the publishable/anon key: safe to ship in the built frontend.
// Every table has RLS enabled with no policies, so this key alone grants
// zero direct table access. All reads/writes go through the RPC functions
// in api/rpc.ts, each of which validates the session token server-side.
export const supabase = createClient(url || "https://placeholder.invalid", anonKey || "placeholder-anon-key", {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default supabase;
