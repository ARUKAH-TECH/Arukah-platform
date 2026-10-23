import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";

export const metadata: Metadata = { title: "Advertisers" };

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  rejected: "bg-black/5 text-foreground/50 dark:bg-white/10",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });
}

export default async function AdminAdvertisersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("advertisers")
    .select("id, business_name, contact_name, status, created_at")
    .order("created_at", { ascending: false });
  const order = { pending: 0, approved: 1, rejected: 2 } as Record<string, number>;
  const advertisers = [...(rows ?? [])].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
  const pendingCount = advertisers.filter((item) => item.status === "pending").length;

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Advertisers</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Applications from the public <Link href="/advertise" target="_blank" className="underline">Advertise With Us</Link> page.
        {pendingCount > 0 && ` ${pendingCount} waiting for review.`}
      </p>

      {advertisers.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/60">No applications yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {advertisers.map((item) => (
                <tr key={item.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/advertisers/${item.id}`} className="font-medium hover:text-brand-primary-text">
                      {item.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{item.contact_name}</td>
                  <td className="px-4 py-3 text-xs text-foreground/70">{formatDate(item.created_at)}</td>
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
