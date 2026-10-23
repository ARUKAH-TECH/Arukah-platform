import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { OutreachForm } from "@/features/admin/cms/OutreachForm";
import { deleteOutreach } from "@/features/admin/cms/outreachActions";
import { OutreachMediaSection } from "@/features/admin/cms/OutreachMediaSection";

export const metadata: Metadata = { title: "Edit outreach" };

export default async function EditOutreachPage({ params, searchParams }: PageProps<"/admin/outreach/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("outreaches")
    .select(
      "id, slug, title, outreach_type, purpose, body, outreach_date, location, needs, facility_permission, status, publish_at, unpublish_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();
  const { data: privateNote } = await supabase
    .from("outreach_private_notes")
    .select("facility_permission_note")
    .eq("outreach_id", id)
    .maybeSingle();

  const isLive = item.status === "published" || item.status === "scheduled";

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/outreach" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All outreach
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
        {isLive && (
          <Link href={`/ministry/outreach/${item.slug}`} target="_blank" className="text-sm text-brand-primary-text hover:underline">
            View on site ↗
          </Link>
        )}
      </div>

      <div className="mt-8 max-w-3xl">
        <OutreachForm
          justSaved={saved === "1"}
          outreach={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            type: item.outreach_type,
            purpose: item.purpose,
            body: item.body,
            date: item.outreach_date,
            location: item.location,
            needs: item.needs,
            facilityPermission: item.facility_permission,
            facilityPermissionNote: privateNote?.facility_permission_note ?? "",
            status: item.status,
            publishAt: item.publish_at,
            unpublishAt: item.unpublish_at,
          }}
        />
      </div>

      <OutreachMediaSection outreachId={item.id} />

      <section className="mt-12 max-w-3xl border-t border-black/10 pt-8 dark:border-white/10">
        <h2 className="text-sm font-semibold">Delete</h2>
        <p className="mt-1 text-xs text-foreground/60">
          Removes it permanently. To hide it but keep it, set the status to Archived instead.
        </p>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this outreach…</summary>
          <form action={deleteOutreach} className="mt-3">
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}
