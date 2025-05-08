import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { env } from "@/utils/env";

// Create a Supabase client
export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

// Create a Supabase admin client for server-side operations
export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
