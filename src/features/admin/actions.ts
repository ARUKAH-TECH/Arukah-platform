"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requirePasswordSession } from "@/server/auth";
import type { AdminFormState, MfaEnrollState } from "@/features/admin/shared";

// One message for every sign-in failure, so the form never reveals whether
// an email address has an account.
const SIGN_IN_FAILED = "Those details didn't work. Check them and try again.";

export async function signIn(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const email = String(formData.get("email") ?? "").trim().slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { status: "error", message: SIGN_IN_FAILED };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { status: "error", message: SIGN_IN_FAILED };

  redirect("/admin/mfa");
}

export async function signOut() {
  await audit("admin.sign_out");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** First-time setup: creates an authenticator-app factor and returns its QR code. */
export async function startMfaEnroll(): Promise<MfaEnrollState> {
  const { supabase } = await requirePasswordSession();

  // Clear half-finished attempts so a retry doesn't fail on duplicates.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) {
    return { status: "error", message: "Couldn't start two-step setup. Please try again." };
  }
  return {
    status: "enrolling",
    message: "",
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/** Checks a 6-digit code — used both to finish setup and on every later sign-in. */
export async function verifyMfa(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const { supabase } = await requirePasswordSession();
  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!factorId || !/^\d{6}$/.test(code)) {
    return { status: "error", message: "Enter the 6-digit code from your authenticator app." };
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { status: "error", message: "That code didn't match. Try the newest one." };

  await audit("admin.sign_in");
  redirect("/admin");
}
