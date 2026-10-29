import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { primaryButtonClasses } from "@/features/admin/ui";
import { formatOutreachDate, needsFacilityPermission, outreachTypeLabel } from "@/config/outreach";

export const metadata: Metadata = { title: "Outreach" };

const statusStyles: Record<string, string> = {
  draft: "bg-black/5 text-foreground/70 dark:bg-white/10",
  scheduled: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  published: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  archived: "bg-black/5 text-foreground/60 dark:bg-white/10",
};

export default async function AdminOutreachPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: outreaches } = await supabase
    .from("outreaches")
    .select("id, title, outreach_type, outreach_date, status, facility_permission")
    .order("outreach_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Ministry outreach</h1>
        <Link href="/admin/outreach/new" className={primaryButtonClasses}>
          New outreach
        </Link>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        Repent Online Ministries visits — shown on the Ministry page and at /ministry/outreach.
      </p>

      {!outreaches?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No outreaches yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wider text-foreground/60 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {outreaches.map((item) => (
                <tr key={item.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/outreach/${item.id}`} className="font-medium hover:text-brand-primary-text">
                      {item.title}
                    </Link>
                    {needsFacilityPermission(item.outreach_type) && !item.facility_permission && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        needs facility permission
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{outreachTypeLabel(item.outreach_type)}</td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{formatOutreachDate(item.outreach_date) || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status] ?? ""}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
