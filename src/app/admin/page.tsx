import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { InstallAdminApp } from "@/features/admin/AdminApp";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_GROUPS } from "@/features/admin/sections";
import { ChartLegend, DailyChart, dayPoints, isoDay, monthPoints, type DayTotal } from "@/features/analytics/DailyChart";

export const metadata: Metadata = { title: "Dashboard" };

// The dashboard: the visitors graph first, then every admin section tucked
// into a few dropdowns so the page stays short on a phone.

// Graph periods: days for the short ones, months for the year.
const PERIODS = [
  { id: "7", label: "7 days", days: 7, by: "day" },
  { id: "30", label: "30 days", days: 30, by: "day" },
  { id: "90", label: "3 months", days: 90, by: "day" },
  { id: "12m", label: "12 months", days: 0, by: "month" },
] as const;

const PAGE = 1000;

export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const { graph } = await searchParams;
  const period = PERIODS.find((p) => p.id === String(graph)) ?? PERIODS[1];

  const today = new Date();
  const start =
    period.by === "month"
      ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1))
      : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (period.days - 1)));
  const dayCount = Math.round((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - start.getTime()) / 86_400_000) + 1;

  const supabase = await createClient();

  // Daily totals, one row per page per day; read in pages so a long period isn't cut short.
  async function readViews() {
    const rows: { day: string; views: number; visits: number }[] = [];
    for (let from = 0; from < PAGE * 50; from += PAGE) {
      const { data, error } = await supabase
        .from("page_view_daily")
        .select("day, views, visits")
        .gte("day", isoDay(start))
        .order("day")
        .range(from, from + PAGE - 1);
      if (error) return { rows, error: true };
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    return { rows, error: false };
  }

  const [views, { count: newMessages }, { count: pendingAdvertisers }, { count: newOrders }] = await Promise.all([
    readViews(),
    supabase.from("inbox_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("ad_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("book_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const byDay = new Map<string, { views: number; visits: number }>();
  for (const r of views.rows) {
    const d = byDay.get(r.day) ?? { views: 0, visits: 0 };
    d.views += r.views;
    d.visits += r.visits;
    byDay.set(r.day, d);
  }
  const series: DayTotal[] = Array.from({ length: dayCount }, (_, i) => {
    const day = isoDay(new Date(start.getTime() + i * 86_400_000));
    return { day, ...(byDay.get(day) ?? { views: 0, visits: 0 }) };
  });
  const points = period.by === "month" ? monthPoints(series) : dayPoints(series);
  const totalViews = series.reduce((s, d) => s + d.views, 0);
  const totalVisits = series.reduce((s, d) => s + d.visits, 0);
  const todayViews = series[series.length - 1]?.views ?? 0;
  const best = points.reduce((b, d) => (d.views > b.views ? d : b), points[0]);

  const counts: Record<string, number> = {
    "/admin/inbox": newMessages ?? 0,
    "/admin/adverts": pendingAdvertisers ?? 0,
    "/admin/book-orders": newOrders ?? 0,
  };
  const totalDue = Object.values(counts).reduce((n, c) => n + c, 0);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <InstallAdminApp />

      {/* ── the graph ── */}
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Website visitors</h2>
            <p className="text-xs text-foreground/60">{period.by === "month" ? "Month by month" : "Day by day"}</p>
          </div>
          <nav aria-label="Graph period" className="flex flex-wrap gap-1.5 text-sm">
            {PERIODS.map((p) => (
              <Link
                key={p.id}
                href={`/admin?graph=${p.id}`}
                scroll={false}
                aria-current={p.id === period.id ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 ${p.id === period.id ? "border-transparent bg-[var(--admin-gold,#e3a82a)] font-semibold text-[#14110c]" : "border-black/10 dark:border-white/10"}`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Page views", value: totalViews, tone: "bg-[#0b3d91] text-white" },
            { label: "Visits", value: totalVisits, tone: "bg-[#e3a82a] text-[#14110c]" },
            { label: "Today", value: todayViews, tone: "bg-black/5 dark:bg-white/10" },
          ].map((t) => (
            <div key={t.label} className={`rounded-xl p-3 ${t.tone}`}>
              <p className="text-xl font-bold tabular-nums">{t.value.toLocaleString()}</p>
              <p className="text-xs opacity-80">{t.label}</p>
            </div>
          ))}
        </div>

        {views.error && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">Visitor numbers couldn&apos;t be loaded just now.</p>
        )}

        <div className="mt-4">
          <ChartLegend />
        </div>
        <div className="mt-2 sm:hidden">
          <DailyChart points={points} compact />
        </div>
        <div className="mt-2 hidden sm:block">
          <DailyChart points={points} />
        </div>
        <p className="mt-2 text-xs text-foreground/60">
          {totalViews > 0 && best ? `Busiest ${period.by === "month" ? "month" : "day"}: ${best.title}, ${best.views} views. ` : ""}
          <Link href="/admin/visitors" className="font-semibold underline">
            More visitor details
          </Link>
        </p>
      </section>

      {/* ── every other section, in one dropdown ── */}
      <details className="group mt-6 rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="text-xl">
            ☰
          </span>
          <span className="flex-1">
            <span className="block font-semibold">All sections</span>
            <span className="block text-xs text-foreground/60">Visitors, Inbox, orders, adverts, articles, books and more</span>
          </span>
          {totalDue > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">{totalDue} new</span>
          )}
          <span aria-hidden="true" className="text-foreground/50 transition-transform group-open:rotate-180">
            ▼
          </span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-black/10 p-3 dark:border-white/10">
          {ADMIN_GROUPS.map((group) => (
            <section key={group.id} aria-label={group.title}>
              <h2 className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                <span aria-hidden="true">{group.icon} </span>
                {group.title}
              </h2>
              <ul className="mt-1 flex flex-col">
                {group.sections.map((section) => (
                  <li key={section.href}>
                    <Link href={section.href} className="flex items-center gap-3 rounded-xl p-3 hover:bg-black/5 dark:hover:bg-white/5">
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">
                          {section.title}
                          {counts[section.href] ? (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                              {counts[section.href]} new
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-foreground/60">{section.description}</span>
                      </span>
                      <span aria-hidden="true" className="text-foreground/40">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
                {group.upcoming?.map((name) => (
                  <li key={name} className="mx-3 mt-1 rounded-xl border border-dashed border-black/15 p-3 dark:border-white/15">
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="block text-xs text-foreground/60">Coming in a later phase</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    </AdminShell>
  );
}
