import { createClient } from "@supabase/supabase-js";

// The anon/publishable key is safe to expose publicly by design (RLS denies
// all direct table access; every real operation goes through the RPC
// functions in api/rpc.ts). Hardcoded as a fallback so the app works
// regardless of whether the hosting platform's env vars are configured.
const FALLBACK_URL = "https://ntjpcyojyzekicimfpdk.supabase.co";
const FALLBACK_ANON_KEY = "sb_publishable_BH_jlzOsTQ68HI3oS61FXQ_YZZmW_zk";

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default supabase;
