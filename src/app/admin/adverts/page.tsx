import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";

export const metadata: Metadata = { title: "Adverts" };

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }) : "None";
}

/** What the admin needs to know at a glance. */
function badge(row: { status: string; starts_at: string | null; ends_at: string | null }) {
  const now = Date.now();
  if (row.status === "pending") return { label: "Pending", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" };
  if (row.status === "rejected") return { label: "Rejected", cls: "bg-black/5 text-foreground/60 dark:bg-white/10" };
  if (row.starts_at && now < Date.parse(row.starts_at)) return { label: "Approved · starts later", cls: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" };
  if (row.ends_at && now >= Date.parse(row.ends_at)) return { label: "Ended", cls: "bg-black/5 text-foreground/60 dark:bg-white/10" };
  return { label: "Showing now", cls: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" };
}

const PAYMENT: Record<string, string> = { unpaid: "Not paid", part: "Part paid", full: "Full paid" };

export default async function AdvertsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data }, { data: stats }] = await Promise.all([
    supabase
      .from("ad_requests")
      .select("id, contact_name, business_name, location, status, starts_at, ends_at, payment_status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("ad_daily_stats").select("ad_id, views, clicks"),
  ]);
  const totals = new Map<string, { views: number; clicks: number }>();
  for (const row of stats ?? []) {
    const t = totals.get(row.ad_id) ?? { views: 0, clicks: 0 };
    t.views += row.views;
    t.clicks += row.clicks;
    totals.set(row.ad_id, t);
  }
  const order: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
  const rows = [...(data ?? [])].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Adverts</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Requests from the{" "}
        <Link href="/advertise" target="_blank" className="underline">
          Advertise With Us
        </Link>{" "}
        page. Open one to approve or reject it, set its dates, and record payment.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/60">No requests yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {rows.map((row) => {
            const b = badge(row);
            return (
              <li key={row.id}>
                <Link href={`/admin/adverts/${row.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${b.cls}`}>{b.label}</span>
                    <span className="text-sm font-medium">{row.business_name || row.contact_name}</span>
                    {row.location && <span className="text-xs text-foreground/60">· {row.location}</span>}
                  </span>
                  <span className="text-xs text-foreground/60">
                    {row.status === "approved" ? `${formatDate(row.starts_at)} → ${formatDate(row.ends_at)} · ` : `Received ${formatDate(row.created_at)} · `}
                    {PAYMENT[row.payment_status] ?? row.payment_status}
                    {totals.has(row.id) && ` · ${totals.get(row.id)!.views} views · ${totals.get(row.id)!.clicks} clicks`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
