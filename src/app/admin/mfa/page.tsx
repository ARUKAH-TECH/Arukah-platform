import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePasswordSession } from "@/server/auth";
import { AuthCard } from "@/features/admin/AuthCard";
import { MfaForm } from "@/features/admin/MfaForm";

export const metadata: Metadata = { title: "Two-step verification" };

export default async function AdminMfaPage() {
  const { supabase } = await requirePasswordSession();

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") redirect("/admin");

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = factors?.totp.find((factor) => factor.status === "verified");

  return (
    <AuthCard title={verified ? "Enter your code" : "Set up two-step verification"}>
      <MfaForm existingFactorId={verified?.id} />
    </AuthCard>
  );
}
