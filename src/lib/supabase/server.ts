import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// A new client per request — never share one across requests. It uses the
// publishable key, so every query is limited by Row Level Security as the
// signed-in user; nothing here can bypass RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies can't be written.
          // src/proxy.ts refreshes the session cookies instead.
        }
      },
    },
  });
}
