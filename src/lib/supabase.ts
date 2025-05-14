import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if required environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  // In development, show a helpful error
  if (process.env.NODE_ENV === "development") {
    console.error(
      "Missing Supabase environment variables. Please check your .env file."
    );
  }
}

// Client for browser usage (with anon key)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Admin client for server-side operations (with service role key)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : supabase;
