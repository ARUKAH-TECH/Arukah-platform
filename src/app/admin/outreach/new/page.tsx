import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { OutreachForm } from "@/features/admin/cms/OutreachForm";

export const metadata: Metadata = { title: "New outreach" };

export default async function NewOutreachPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/outreach" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All outreach
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New outreach</h1>
      <p className="mt-1 text-sm text-foreground/60">Save it as a draft first; you can review it before publishing.</p>
      <div className="mt-8 max-w-3xl">
        <OutreachForm
          outreach={{
            title: "",
            slug: "",
            type: "community",
            purpose: "",
            body: "",
            date: null,
            location: "",
            needs: [],
            facilityPermission: false,
            facilityPermissionNote: "",
            status: "draft",
            publishAt: null,
            unpublishAt: null,
          }}
        />
      </div>
    </AdminShell>
  );
}
