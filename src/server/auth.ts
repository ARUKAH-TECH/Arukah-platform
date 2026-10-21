import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "owner";

export interface AdminSession {
  userId: string;
  email: string;
  role: AdminRole;
}

/**
 * The real gate for everything under /admin. Call it at the top of every
 * admin page AND every admin Server Action — layouts alone aren't enough,
 * because Server Actions can be called directly.
 *
 * Passes only when all three hold:
 * 1. a valid Supabase session (verified with the Auth server, not just read
 *    from the cookie),
 * 2. the session completed two-factor authentication (aal2),
 * 3. the user has a row in public.admin_users.
 */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin/mfa");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/admin/login?error=not-authorised");

  return { userId: user.id, email: user.email ?? "", role: admin.role as AdminRole };
});

/** Signed in with a password but not yet through two-factor — for /admin/mfa only. */
export async function requirePasswordSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return { supabase, user };
}

/** Appends to the audit log. RLS only accepts rows from a verified admin, as themselves. */
export async function audit(action: string, details: Record<string, unknown> = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_log").insert({ actor: user.id, action, details });
}
