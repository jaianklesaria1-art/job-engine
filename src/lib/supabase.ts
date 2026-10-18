import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const OWNER_EMAIL = "jaianklesaria.jobs@gmail.com";

export const supabaseConfigured = Boolean(url && anonKey);

// The anon key is public by design; row-level security limits every table to OWNER_EMAIL.
export const supabase = createClient(url ?? "http://localhost", anonKey ?? "missing", {
  auth: { persistSession: true, detectSessionInUrl: true },
});
