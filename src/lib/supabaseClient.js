import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  console.warn(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env locally, " +
    "and add both as Environment Variables in your Vercel project (then redeploy)."
  );
}

// Fall back to a syntactically-valid placeholder URL so createClient never throws
// and crashes the whole app before it can render an on-screen error message.
export const supabase = createClient(
  supabaseConfigured ? url : "https://placeholder.supabase.co",
  supabaseConfigured ? anonKey : "placeholder-anon-key"
);