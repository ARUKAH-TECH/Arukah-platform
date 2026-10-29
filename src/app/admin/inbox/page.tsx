import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";

export const metadata: Metadata = { title: "Inbox" };

const statusStyles: Record<string, string> = {
  new: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  in_progress: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  handled: "bg-black/5 text-foreground/60 dark:bg-white/10",
};
const statusLabels: Record<string, string> = { new: "new", in_progress: "in progress", handled: "handled" };
const kindLabels: Record<string, string> = { enquiry: "Enquiry", ministry: "Ministry" };

const FILTERS = [
  { id: "open", label: "Open" },
  { id: "enquiry", label: "Enquiries" },
  { id: "ministry", label: "Ministry" },
  { id: "handled", label: "Handled" },
  { id: "all", label: "All" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });
}

export default async function InboxPage({ searchParams }: PageProps<"/admin/inbox">) {
  const admin = await requireAdmin();
  const { show } = await searchParams;
  const filter = FILTERS.some((f) => f.id === show) ? (show as string) : "open";

  const supabase = await createClient();
  let query = supabase
    .from("inbox_messages")
    .select("id, kind, full_name, topic, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter === "open") query = query.neq("status", "handled");
  if (filter === "handled") query = query.eq("status", "handled");
  if (filter === "enquiry" || filter === "ministry") query = query.eq("kind", filter);
  const [{ data: messages }, { count: pendingAdvertisers }] = await Promise.all([
    query,
    supabase.from("ad_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Messages from the Contact page and the Ministry response form. Only verified admins can read them.
        {(pendingAdvertisers ?? 0) > 0 && (
          <>
            {" "}
            <Link href="/admin/adverts" className="underline">
              {pendingAdvertisers} advert request{pendingAdvertisers === 1 ? "" : "s"} waiting
            </Link>
            .
          </>
        )}
      </p>

      <nav aria-label="Filter" className="mt-6 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/admin/inbox?show=${f.id}`}
            className={`rounded-full border px-3 py-1 ${
              filter === f.id
                ? "border-brand-primary-text font-medium text-brand-primary-text"
                : "border-black/10 text-foreground/70 dark:border-white/10"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {!messages?.length ? (
        <p className="mt-8 text-sm text-foreground/60">Nothing here.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {messages.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/inbox/${m.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[m.status] ?? ""}`}>
                  {statusLabels[m.status] ?? m.status}
                </span>
                <span className={`text-sm ${m.status === "new" ? "font-semibold" : ""}`}>{m.full_name}</span>
                <span className="text-xs text-foreground/60">
                  {kindLabels[m.kind] ?? m.kind}
                  {m.topic ? ` · ${m.topic}` : ""}
                </span>
                <span className="ml-auto text-xs text-foreground/60">{formatDate(m.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
