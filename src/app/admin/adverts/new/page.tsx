import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { InPersonAdForm } from "@/features/admin/cms/InPersonAdForm";

export const metadata: Metadata = { title: "Add advert" };

export default async function NewAdvertPage() {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/adverts" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All adverts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">➕ Add an advert (in person)</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground/60">
        For an advert someone agreed with you face to face or on the phone. Step 1: their details. Step 2 (next screen): approve it, set the dates and payment, and add the
        picture, video or designed text advert.
      </p>
      <section className="mt-6 max-w-xl rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <InPersonAdForm />
      </section>
    </AdminShell>
  );
}
