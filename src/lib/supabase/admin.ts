import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises"
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
