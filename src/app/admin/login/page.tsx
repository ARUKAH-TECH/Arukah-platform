import type { Metadata } from "next";
import { AuthCard } from "@/features/admin/AuthCard";
import { LoginForm } from "@/features/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;

  return (
    <AuthCard title="Sign in">
      {error === "not-authorised" && (
        <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-400">
          This account doesn&apos;t have admin access.
        </p>
      )}
      <LoginForm />
    </AuthCard>
  );
}
