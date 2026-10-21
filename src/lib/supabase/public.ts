import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Cookie-less, anonymous client for public pages. It can only ever see what
// Row Level Security allows the public to see, and because it doesn't read
// cookies, pages using it stay statically cached (refreshed by `revalidate`
// and by revalidatePath() after admin edits).
export function createPublicClient() {
  return createClient(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mediaPublicUrl(storagePath: string) {
  return `${supabaseUrl()}/storage/v1/object/public/media/${storagePath}`;
}
