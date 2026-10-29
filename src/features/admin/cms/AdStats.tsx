import { createClient } from "@/lib/supabase/server";

/** Views and clicks for one advert: totals plus the last 14 days. Admin-only. */
export async function AdStats({ adId }: { adId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_daily_stats")
    .select("day, views, clicks")
    .eq("ad_id", adId)
    .order("day", { ascending: false });
  const rows = data ?? [];
  const views = rows.reduce((sum, row) => sum + row.views, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const rate = views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : "—";

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-zinc-900">
      <h2 className="font-semibold">Report</h2>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Views", value: views.toLocaleString("en-GB") },
          { label: "Clicks", value: clicks.toLocaleString("en-GB") },
          { label: "Click rate", value: rate },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/5">
            <p className="text-xl font-semibold">{stat.value}</p>
            <p className="text-xs text-foreground/60">{stat.label}</p>
          </div>
        ))}
      </div>
      {rows.length > 0 ? (
        <table className="mt-4 w-full text-left text-xs">
          <thead className="text-foreground/60">
            <tr>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Views</th>
              <th className="py-1 text-right font-medium">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 14).map((row) => (
              <tr key={row.day} className="border-t border-black/5 dark:border-white/5">
                <td className="py-1">
                  {new Date(`${row.day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                </td>
                <td className="py-1 text-right">{row.views}</td>
                <td className="py-1 text-right">{row.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-xs text-foreground/60">No views yet — numbers appear once the advert is showing.</p>
      )}
      <p className="mt-3 text-xs text-foreground/60">
        A view is counted each time the advert appears on someone&apos;s screen; a click when they tap it. Numbers are a
        good guide but can&apos;t tell people from automated visitors.
      </p>
    </section>
  );
}
