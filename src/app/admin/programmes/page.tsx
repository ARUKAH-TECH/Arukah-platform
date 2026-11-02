import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { formatGhs } from "@/config/books";
import { PROGRAMME_STATUS_LABELS, formatWhen, platformName, type ProgrammeStatus } from "@/features/programmes/shared";

export const metadata: Metadata = { title: "Online programmes" };

const BADGE: Record<ProgrammeStatus, string> = {
  draft: "bg-black/5 text-foreground/70 dark:bg-white/10",
  published: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  closed: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  completed: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  cancelled: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export default async function ProgrammesAdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("programmes")
    .select("id, title, category, status, starts_at, time_zone, schedule_note, price_ghs, capacity, platform, platform_name")
    .order("starts_at", { ascending: false });

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">🎓 Online programmes</h1>
        <Link href="/admin/programmes/new" className="rounded-full bg-[var(--admin-gold,#e3a82a)] px-4 py-2 text-sm font-bold text-[#14110c]">
          ➕ New programme
        </Link>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-foreground/60">
        Classes, trainings and events held online (Zoom, Google Meet, Teams or another platform). Free or paid, with secret codes that unlock the joining details.
      </p>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-900">Programmes couldn&apos;t be loaded just now.</p>}
      {!rows?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No programmes yet. Tap &ldquo;New programme&rdquo; to add the first one.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/programmes/${p.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE[p.status as ProgrammeStatus] ?? ""}`}>
                    {PROGRAMME_STATUS_LABELS[p.status as ProgrammeStatus]?.split(" (")[0] ?? p.status}
                  </span>
                  <span className="font-semibold">{p.title}</span>
                </span>
                <span className="text-xs text-foreground/60">
                  {p.schedule_note || formatWhen(p.starts_at, p.time_zone)} · {platformName(p.platform, p.platform_name)} ·{" "}
                  {Number(p.price_ghs) > 0 ? formatGhs(Number(p.price_ghs)) : "Free"}
                  {p.capacity ? ` · ${p.capacity} places` : ""}
                  {p.category ? ` · ${p.category}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
