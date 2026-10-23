import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

// Server-only client using the service key. It is used ONLY by the payment
// code (src/server/payments.ts), after Paystack itself has confirmed a
// payment. The database grants this key just the few columns it needs.
// Never import this from a client component.
export function serviceKeyConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — see docs/ENVIRONMENT.md");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
