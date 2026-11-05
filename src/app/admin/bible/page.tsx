import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Bible app" };

const pill = (published: boolean) =>
  `rounded-full px-2 py-0.5 text-[11px] font-medium ${published ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-black/5 text-foreground/70 dark:bg-white/10"}`;

export default async function AdminBiblePage({ searchParams }: PageProps<"/admin/bible">) {
  const admin = await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: devotionals }, { data: series }] = await Promise.all([
    supabase.from("bible_devotionals").select("id, day, title, status").order("day", { ascending: false }).limit(60),
    supabase.from("bible_series").select("id, title, status, bible_lessons(id)").order("sort_order").order("created_at"),
  ]);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Bible app</h1>
      <p className="mt-1 text-sm text-foreground/60">
        zivarukah.com/bible: the KJV Bible is built in. Here you write the daily devotionals and the Bible studies.{" "}
        <Link href="/bible" className="font-semibold underline">
          Open the Bible app
        </Link>
      </p>
      {deleted === "1" && <p className="mt-4 text-sm text-green-700 dark:text-green-400">Deleted.</p>}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">🌅 Daily devotionals</h2>
          <Link href="/admin/bible/devotionals/new" className={primaryButtonClasses}>
            + New devotional
          </Link>
        </div>
        {!devotionals?.length ? (
          <p className="mt-3 text-sm text-foreground/60">None yet. Write the first one; you can also write several days ahead.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
            {devotionals.map((d) => (
              <li key={d.id}>
                <Link href={`/admin/bible/devotionals/${d.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span className={pill(d.status === "published")}>{d.status === "published" ? (d.day > today ? "Scheduled" : "Published") : "Draft"}</span>
                  <span className="text-xs text-foreground/60">{d.day}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{d.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">🎓 Bible studies</h2>
          <Link href="/admin/bible/series/new" className={secondaryButtonClasses}>
            + New study
          </Link>
        </div>
        {!series?.length ? (
          <p className="mt-3 text-sm text-foreground/60">None yet. Create a study (e.g. “Foundations for New Believers”), then add its lessons.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
            {series.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/bible/series/${s.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span className={pill(s.status === "published")}>{s.status === "published" ? "Published" : "Draft"}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
                  <span className="text-xs text-foreground/60">{Array.isArray(s.bible_lessons) ? s.bible_lessons.length : 0} lessons</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
