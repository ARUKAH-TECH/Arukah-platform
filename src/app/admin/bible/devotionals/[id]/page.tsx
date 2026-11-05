import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { DevotionalForm } from "@/features/admin/cms/BibleForms";
import { deleteDevotional } from "@/features/admin/cms/bibleActions";

export const metadata: Metadata = { title: "Edit devotional" };

export default async function EditDevotionalPage({ params, searchParams }: PageProps<"/admin/bible/devotionals/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: d } = await supabase.from("bible_devotionals").select("id, day, title, verse_ref, body, prayer, status").eq("id", id).maybeSingle();
  if (!d) notFound();
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/bible" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← Bible app
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Edit devotional</h1>
        {d.status === "published" && (
          <Link href={`/bible/devotionals/${d.day}`} className="text-sm font-semibold underline">
            View on the website ↗
          </Link>
        )}
      </div>
      <div className="mt-6 max-w-3xl">
        <DevotionalForm
          saved={typeof saved === "string" ? saved : undefined}
          values={{ id: d.id, day: d.day, title: d.title, verseRef: d.verse_ref, body: d.body, prayer: d.prayer, status: d.status }}
        />
        <form action={deleteDevotional} className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <input type="hidden" name="id" value={d.id} />
          <button type="submit" className="text-sm font-medium text-red-700 underline dark:text-red-400">
            Delete this devotional
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
