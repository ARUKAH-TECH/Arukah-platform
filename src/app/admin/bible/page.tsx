import type { Metadata } from "next";
import Link from "next/link";
import { pushStats } from "@/server/push";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";
import { BibleSettingsForm, TestNotificationForm, WriteNowForm, type ThemeRow } from "@/features/admin/cms/BibleSettings";

export const metadata: Metadata = { title: "Bible app" };

const pill = (published: boolean) =>
  `rounded-full px-2 py-0.5 text-[11px] font-medium ${published ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-black/5 text-foreground/70 dark:bg-white/10"}`;

export default async function AdminBiblePage({ searchParams }: PageProps<"/admin/bible">) {
  const admin = await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const year = today.slice(0, 4);
  const month = today.slice(0, 7);
  const nextDate = new Date(`${month}-01T00:00:00Z`);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  const nextMonth = nextDate.toISOString().slice(0, 7);
  const monthName = (p: string) => new Date(`${p}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const [{ data: devotionals }, { data: series }, { data: themeRows }, { data: setting }, push] = await Promise.all([
    supabase.from("bible_devotionals").select("id, day, title, status, auto").order("day", { ascending: false }).limit(60),
    supabase.from("bible_series").select("id, title, status, bible_lessons(id)").order("sort_order").order("created_at"),
    supabase.from("bible_themes").select("period, theme, scripture").in("period", [year, month, nextMonth]),
    supabase.from("bible_settings").select("value").eq("key", "auto_devotional").maybeSingle(),
    pushStats().catch(() => ({ phones: 0, log: [] as { day: string; sent: number; failed: number }[] })),
  ]);
  const theme = (period: string, label: string): ThemeRow => {
    const row = (themeRows ?? []).find((r) => r.period === period);
    return { period, label, theme: row?.theme ?? "", scripture: row?.scripture ?? "" };
  };

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

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">🎯 Themes and the automatic 6:00am devotional</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Every morning at 6:00am (Ghana time), if no devotional is published for the day, one is written on these themes with AI and its Bible verses are
          checked against the KJV.
        </p>
        <div className="mt-4">
          <BibleSettingsForm
            mode={setting?.value ?? "publish"}
            themes={[theme(year, `Theme of the year ${year}`), theme(month, `Theme for ${monthName(month)}`), theme(nextMonth, `Theme for ${monthName(nextMonth)}`)]}
          />
        </div>
        <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="text-sm font-semibold">Want a head start?</p>
          <p className="text-xs text-foreground/60">Writes a devotional on the themes as a draft. You read it, change anything, then publish.</p>
          <div className="mt-2">
            <WriteNowForm day={today} />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">🔔 Daily notifications</h2>
        <p className="mt-1 text-sm text-foreground/60">
          {push.phones} phone{push.phones === 1 ? "" : "s"} get the morning notification (around 6:00am) with the devotional and its scripture. If no devotional is
          published by 6:35am, they get the verse of the day.
        </p>
        {push.log.length > 0 && (
          <p className="mt-1 text-xs text-foreground/60">
            Last sent: {push.log.map((l) => `${l.day} (${l.sent} delivered${l.failed ? `, ${l.failed} missed` : ""})`).join(" · ")}
          </p>
        )}
        <div className="mt-3">
          <TestNotificationForm phones={push.phones} />
        </div>
      </section>

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
                  {d.auto && <span className="text-xs text-foreground/60">✨ auto</span>}
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
