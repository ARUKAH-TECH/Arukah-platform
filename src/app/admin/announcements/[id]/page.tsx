import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { AnnouncementForm } from "@/features/admin/cms/AnnouncementForm";
import { deleteAnnouncement } from "@/features/admin/cms/announcementActions";
import { secondaryButtonClasses } from "@/features/admin/ui";
import type { AnnouncementToneValue } from "@/features/admin/cms/shared";

export const metadata: Metadata = { title: "Edit announcement" };

export default async function EditAnnouncementPage({ params, searchParams }: PageProps<"/admin/announcements/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("announcements")
    .select("id, title, message, link_url, link_label, tone, status, publish_at, unpublish_at, branches")
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/announcements" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All announcements
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{item.title}</h1>

      <div className="mt-8 max-w-3xl">
        <AnnouncementForm
          justSaved={saved === "1"}
          announcement={{
            id: item.id,
            title: item.title,
            message: item.message,
            linkUrl: item.link_url,
            linkLabel: item.link_label,
            tone: item.tone as AnnouncementToneValue,
            status: item.status,
            publishAt: item.publish_at,
            unpublishAt: item.unpublish_at,
            branches: item.branches,
          }}
        />
      </div>

      <section className="mt-12 max-w-3xl border-t border-black/10 pt-8 dark:border-white/10">
        <h2 className="text-sm font-semibold">Delete</h2>
        <p className="mt-1 text-xs text-foreground/60">
          Removes it permanently. To hide it but keep it for later, set the status to Archived instead.
        </p>
        <form action={deleteAnnouncement} className="mt-3">
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className={`${secondaryButtonClasses} text-red-700 dark:text-red-400`}>
            Delete announcement
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
