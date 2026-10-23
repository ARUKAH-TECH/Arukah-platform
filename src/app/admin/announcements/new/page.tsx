import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { AnnouncementForm } from "@/features/admin/cms/AnnouncementForm";

export const metadata: Metadata = { title: "New announcement" };

export default async function NewAnnouncementPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/announcements" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All announcements
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New announcement</h1>
      <div className="mt-8 max-w-3xl">
        <AnnouncementForm
          announcement={{
            title: "",
            message: "",
            linkUrl: null,
            linkLabel: "",
            tone: "info",
            status: "draft",
            publishAt: null,
            unpublishAt: null,
            branches: [],
          }}
        />
      </div>
    </AdminShell>
  );
}
