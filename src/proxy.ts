import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Keeps the admin session cookies fresh. This is NOT the access check —
// every admin page and action calls requireAdmin() on the server, and the
// database enforces Row Level Security on top of that.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Triggers a token refresh when needed; the result itself isn't used here.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
