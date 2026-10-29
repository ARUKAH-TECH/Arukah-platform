import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { primaryButtonClasses } from "@/features/admin/ui";
import { branchLabel } from "@/config/branches";

export const metadata: Metadata = { title: "Announcements" };

const statusStyles: Record<string, string> = {
  draft: "bg-black/5 text-foreground/70 dark:bg-white/10",
  scheduled: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  published: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  archived: "bg-black/5 text-foreground/60 dark:bg-white/10",
};

function formatDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" })
    : "—";
}

export default async function AdminAnnouncementsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, status, branches, publish_at, unpublish_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <Link href="/admin/announcements/new" className={primaryButtonClasses}>
          New announcement
        </Link>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        Banners shown at the top of the pages you choose, with optional start and end times.
      </p>

      {!announcements?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No announcements yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wider text-foreground/60 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Headline</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Shown on</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">End</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((item) => (
                <tr key={item.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/announcements/${item.id}`} className="font-medium hover:text-brand-primary-text">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status] ?? ""}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/70">
                    {(item.branches as string[]).map(branchLabel).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{formatDate(item.publish_at)}</td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{formatDate(item.unpublish_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
