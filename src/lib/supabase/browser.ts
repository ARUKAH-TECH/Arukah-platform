import { createBrowserClient } from "@supabase/ssr";

// Used only by admin Client Components (image uploads go straight from the
// browser to Storage). Storage policies still require a verified admin.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
