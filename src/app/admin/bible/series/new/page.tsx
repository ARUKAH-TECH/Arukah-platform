import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { SeriesForm } from "@/features/admin/cms/BibleForms";

export const metadata: Metadata = { title: "New Bible study" };

export default async function NewSeriesPage() {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/bible" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← Bible app
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New Bible study</h1>
      <p className="mt-1 text-sm text-foreground/60">Save it first, then add its lessons.</p>
      <div className="mt-6 max-w-3xl">
        <SeriesForm values={{ title: "", slug: "", summary: "", sortOrder: 0, status: "draft" }} />
      </div>
    </AdminShell>
  );
}
