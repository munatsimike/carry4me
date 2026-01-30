import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

const isDev = import.meta.env.DEV;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // In dev, stop the constant refresh-token retries when the local server is down.
    autoRefreshToken: !isDev ? true : false,

    // Keep these as you like:
    persistSession: false,
    detectSessionInUrl: true,
  },
});
