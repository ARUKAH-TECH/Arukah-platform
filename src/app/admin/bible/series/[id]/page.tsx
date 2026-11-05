import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { SeriesForm } from "@/features/admin/cms/BibleForms";
import { deleteSeries } from "@/features/admin/cms/bibleActions";
import { primaryButtonClasses } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Edit Bible study" };

export default async function EditSeriesPage({ params, searchParams }: PageProps<"/admin/bible/series/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved, deleted } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: s }, { data: lessons }] = await Promise.all([
    supabase.from("bible_series").select("id, title, slug, summary, sort_order, status").eq("id", id).maybeSingle(),
    supabase.from("bible_lessons").select("id, position, title, status").eq("series_id", id).order("position").order("created_at"),
  ]);
  if (!s) notFound();
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/bible" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← Bible app
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
        {s.status === "published" && (
          <Link href={`/bible/studies/${s.slug}`} className="text-sm font-semibold underline">
            View on the website ↗
          </Link>
        )}
      </div>

      <section className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Lessons</h2>
          <Link href={`/admin/bible/lessons/new?series=${s.id}`} className={primaryButtonClasses}>
            + Add lesson
          </Link>
        </div>
        {deleted === "1" && <p className="mt-2 text-sm text-green-700">Lesson deleted.</p>}
        {!lessons?.length ? (
          <p className="mt-3 text-sm text-foreground/60">No lessons yet.</p>
        ) : (
          <ol className="mt-3 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/bible/lessons/${l.id}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-8 text-sm font-bold">{l.position}.</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{l.title}</span>
                  <span className="text-xs text-foreground/60">{l.status === "published" ? "Published" : "Draft"}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 text-xs text-foreground/60">Visitors see the study and its published lessons only when the study itself is published.</p>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="text-lg font-semibold">About this study</h2>
        <div className="mt-4">
          <SeriesForm
            saved={typeof saved === "string" ? saved : undefined}
            values={{ id: s.id, title: s.title, slug: s.slug, summary: s.summary, sortOrder: s.sort_order, status: s.status }}
          />
        </div>
        <form action={deleteSeries} className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <input type="hidden" name="id" value={s.id} />
          <button type="submit" className="text-sm font-medium text-red-700 underline dark:text-red-400">
            Delete this study and all its lessons
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
