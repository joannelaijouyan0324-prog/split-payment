import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
