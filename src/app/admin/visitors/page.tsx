import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { SOURCE_LABELS, type Source } from "@/features/analytics/sources";
import { ChartLegend, DailyChart, dayPoints, isoDay } from "@/features/analytics/DailyChart";

export const metadata: Metadata = { title: "Visitors" };

// Daily totals only (see supabase/migrations/…_page_views.sql): no personal
// data exists to show. "Visits" = browsing sessions; "views" = pages opened.

const RANGES = [7, 30, 90] as const;

const NAMES: Record<string, string> = {
  "/": "Homepage",
  "/books": "Books",
  "/literacy": "Literacy & Handwriting Coach",
  "/ministry": "Ministry",
  "/ministry/support": "Giving: Support the outreach",
  "/ministry/outreach": "Outreach",
  "/ziva": "ZIVA Special Classes",
  "/tech": "ARUKAH TECH",
  "/footwear": "ARUKAH WEAR",
  "/media": "ARUKAH MEDIA",
  "/articles": "Articles",
  "/projects": "Projects",
  "/contact": "Contact",
  "/advertise": "Advertise with us",
  "/payments/done": "Payment finished",
  "/basket": "Book basket",
};

function titleCase(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pageName(path: string) {
  if (NAMES[path]) return NAMES[path];
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "books" && parts[2] === "read") return `Reading online: ${titleCase(parts[1])}`;
  if (parts[0] === "books" && parts[1]) return `Book: ${titleCase(parts[1])}`;
  if (parts[0] === "articles" && parts[1]) return `Article: ${titleCase(parts[1])}`;
  if (parts[0] === "projects" && parts[1]) return `Project: ${titleCase(parts[1])}`;
  return path;
}

const SOURCE_ICONS: Record<Source, string> = {
  direct: "🔗",
  whatsapp: "💬",
  facebook: "📘",
  google: "🔎",
  tiktok: "🎵",
  youtube: "▶️",
  instagram: "📸",
  x: "✖️",
  search: "🔍",
  other: "🌐",
};

function Bar({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon?: string }) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <span className="truncate text-sm">
        {icon && <span aria-hidden="true">{icon} </span>}
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value.toLocaleString()}</span>
      <span className="col-span-2 h-2.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <span className="block h-full rounded-full" style={{ width: `${Math.max(2, (value / Math.max(1, max)) * 100)}%`, background: color }} />
      </span>
    </li>
  );
}

export default async function VisitorsPage({ searchParams }: PageProps<"/admin/visitors">) {
  const admin = await requireAdmin();
  const { days: daysParam } = await searchParams;
  const range = RANGES.find((r) => String(r) === String(daysParam)) ?? 30;

  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (range - 1)));
  const supabase = await createClient();
  const [{ data: rows, error }, { data: sourceRows }] = await Promise.all([
    supabase.from("page_view_daily").select("day, path, views, visits").gte("day", isoDay(start)).limit(20000),
    supabase.from("page_view_sources").select("day, source, views").gte("day", isoDay(start)).limit(5000),
  ]);

  const byDay = new Map<string, { views: number; visits: number }>();
  const byPage = new Map<string, number>();
  for (const r of rows ?? []) {
    const d = byDay.get(r.day) ?? { views: 0, visits: 0 };
    d.views += r.views;
    d.visits += r.visits;
    byDay.set(r.day, d);
    byPage.set(r.path, (byPage.get(r.path) ?? 0) + r.views);
  }
  const series = Array.from({ length: range }, (_, i) => {
    const day = isoDay(new Date(start.getTime() + i * 86_400_000));
    return { day, ...(byDay.get(day) ?? { views: 0, visits: 0 }) };
  });
  const totalViews = series.reduce((s, d) => s + d.views, 0);
  const totalVisits = series.reduce((s, d) => s + d.visits, 0);
  const best = series.reduce((b, d) => (d.views > b.views ? d : b), series[0]);
  const pages = [...byPage.entries()].sort((a, b) => b[1] - a[1]);
  const sources = new Map<Source, number>();
  for (const r of sourceRows ?? []) sources.set(r.source as Source, (sources.get(r.source as Source) ?? 0) + r.views);
  const sourceList = [...sources.entries()].sort((a, b) => b[1] - a[1]);
  const todayViews = series[series.length - 1]?.views ?? 0;

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visitors</h1>
          <p className="mt-1 text-sm text-foreground/60">How many people open each page. Counts only, no personal details are collected.</p>
        </div>
        <nav aria-label="Period" className="flex gap-1.5 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/visitors?days=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 ${r === range ? "border-transparent bg-[var(--admin-gold,#e3a82a)] font-semibold text-[#14110c]" : "border-black/10 dark:border-white/10"}`}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">Visitor numbers couldn&apos;t be loaded just now.</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Page views", value: totalViews.toLocaleString(), tone: "bg-[#0b3d91] text-white" },
          { label: "Visits", value: totalVisits.toLocaleString(), tone: "bg-[#e3a82a] text-[#14110c]" },
          { label: "Today so far", value: todayViews.toLocaleString(), tone: "bg-black/5 dark:bg-white/10" },
          {
            label: "Pages per visit",
            value: totalVisits ? (totalViews / totalVisits).toFixed(1) : "None",
            tone: "bg-black/5 dark:bg-white/10",
          },
        ].map((t) => (
          <div key={t.label} className={`rounded-2xl p-4 ${t.tone}`}>
            <p className="text-2xl font-bold tabular-nums">{t.value}</p>
            <p className="text-sm opacity-80">{t.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Every day</h2>
          <ChartLegend />
        </div>
        <div className="mt-3 sm:hidden">
          <DailyChart points={dayPoints(series)} compact />
        </div>
        <div className="mt-3 hidden sm:block">
          <DailyChart points={dayPoints(series)} />
        </div>
        {totalViews > 0 && (
          <p className="mt-2 text-xs text-foreground/60">
            Busiest day: {new Date(`${best.day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })},{" "}
            {best.views} views.
          </p>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="font-semibold">Most viewed pages</h2>
          {pages.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/60">No views yet in this period. Numbers appear as people visit the website.</p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {pages.slice(0, 25).map(([path, views]) => (
                <Bar key={path} label={pageName(path)} value={views} max={pages[0][1]} color="#0b3d91" />
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="font-semibold">Where visitors come from</h2>
          {sourceList.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/60">No visits yet in this period.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {sourceList.map(([source, n]) => (
                <Bar
                  key={source}
                  label={SOURCE_LABELS[source] ?? source}
                  icon={SOURCE_ICONS[source]}
                  value={n}
                  max={sourceList[0][1]}
                  color={source === "whatsapp" ? "#25D366" : "#e3a82a"}
                />
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs leading-5 text-foreground/60">
            Links shared with the website&apos;s WhatsApp buttons are counted as WhatsApp. Visits from links people copy and paste themselves
            may show as &ldquo;Typed / bookmark / app&rdquo;.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
