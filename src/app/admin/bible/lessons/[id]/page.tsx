import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { LessonForm } from "@/features/admin/cms/BibleForms";
import { deleteLesson } from "@/features/admin/cms/bibleActions";

export const metadata: Metadata = { title: "Edit lesson" };

export default async function EditLessonPage({ params, searchParams }: PageProps<"/admin/bible/lessons/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: l } = await supabase.from("bible_lessons").select("id, series_id, position, title, scripture, body, quiz, status, bible_series(title)").eq("id", id).maybeSingle();
  if (!l) notFound();
  const series = (Array.isArray(l.bible_series) ? l.bible_series[0] : l.bible_series) as { title: string } | null;
  return (
    <AdminShell email={admin.email}>
      <Link href={`/admin/bible/series/${l.series_id}`} className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← {series?.title ?? "Bible study"}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit lesson</h1>
      <div className="mt-6 max-w-3xl">
        <LessonForm
          saved={typeof saved === "string" ? saved : undefined}
          values={{ id: l.id, seriesId: l.series_id, position: l.position, title: l.title, scripture: l.scripture, body: l.body, quiz: l.quiz, status: l.status }}
        />
        <form action={deleteLesson} className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <input type="hidden" name="id" value={l.id} />
          <input type="hidden" name="seriesId" value={l.series_id} />
          <button type="submit" className="text-sm font-medium text-red-700 underline dark:text-red-400">
            Delete this lesson
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
