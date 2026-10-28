import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

// Server-only client using the service key. It is used ONLY by the payment
// code (src/server/payments.ts), after Paystack itself has confirmed a
// payment. The database grants this key just the few columns it needs.
// Never import this from a client component.
export function serviceKeyConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * True when the saved key really is the server (service_role / secret) key and
 * not the public anon/publishable key, which looks similar. Reads only the
 * key's role label — the public middle part of a JWT — never its signature.
 */
export function serviceKeyIsServiceRole() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (key.startsWith("sb_secret_")) return true;
  if (key.startsWith("sb_publishable_")) return false;
  const part = key.split(".")[1];
  if (!part) return false;
  try {
    const payload = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — see docs/ENVIRONMENT.md");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
