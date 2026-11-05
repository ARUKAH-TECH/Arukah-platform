import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { LessonForm } from "@/features/admin/cms/BibleForms";

export const metadata: Metadata = { title: "New lesson" };

export default async function NewLessonPage({ searchParams }: PageProps<"/admin/bible/lessons/new">) {
  const admin = await requireAdmin();
  const { series } = await searchParams;
  const seriesId = typeof series === "string" ? series : "";
  if (!/^[0-9a-f-]{36}$/.test(seriesId)) notFound();
  const supabase = await createClient();
  const [{ data: s }, { count }] = await Promise.all([
    supabase.from("bible_series").select("id, title").eq("id", seriesId).maybeSingle(),
    supabase.from("bible_lessons").select("id", { count: "exact", head: true }).eq("series_id", seriesId),
  ]);
  if (!s) notFound();
  return (
    <AdminShell email={admin.email}>
      <Link href={`/admin/bible/series/${s.id}`} className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← {s.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New lesson</h1>
      <div className="mt-6 max-w-3xl">
        <LessonForm values={{ seriesId: s.id, position: (count ?? 0) + 1, title: "", scripture: "", body: "", quiz: "", status: "published" }} />
      </div>
    </AdminShell>
  );
}
