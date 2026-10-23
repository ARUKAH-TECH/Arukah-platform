import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { formatGhs } from "@/config/books";

export const metadata: Metadata = { title: "Book orders" };

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  paid: { label: "Paid", cls: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" },
  printing: { label: "Printing", cls: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" },
  ready: { label: "Ready to collect", cls: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" },
  shipped: { label: "Sent out", cls: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" },
  delivered: { label: "Done", cls: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" },
  cancelled: { label: "Cancelled", cls: "bg-black/5 text-foreground/50 dark:bg-white/10" },
};
const PAYMENT: Record<string, string> = { unpaid: "Not paid", part: "Part paid", full: "Full paid" };

export default async function BookOrdersPage({ searchParams }: PageProps<"/admin/book-orders">) {
  const admin = await requireAdmin();
  const { show } = await searchParams;
  const openOnly = show !== "all";
  const supabase = await createClient();
  let query = supabase
    .from("book_orders")
    .select("id, reference, customer_name, total_ghs, delivery_fee_ghs, status, payment_status, item_count, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (openOnly) query = query.not("status", "in", "(delivered,cancelled)");
  const { data: orders } = await query;

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Book orders</h1>
      <nav className="mt-4 flex gap-2 text-sm">
        <Link href="/admin/book-orders" className={`rounded-full border px-3 py-1 ${openOnly ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}>
          Open
        </Link>
        <Link href="/admin/book-orders?show=all" className={`rounded-full border px-3 py-1 ${!openOnly ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}>
          All
        </Link>
      </nav>
      {!orders?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No orders here.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {orders.map((o) => {
            const s = STATUS[o.status] ?? { label: o.status, cls: "" };
            return (
              <li key={o.id}>
                <Link href={`/admin/book-orders/${o.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
                    <span className="font-mono text-sm font-semibold">{o.reference}</span>
                    <span className="text-sm">{o.customer_name}</span>
                  </span>
                  <span className="text-xs text-foreground/60">
                    {o.item_count} book{o.item_count === 1 ? "" : "s"} · {formatGhs(Number(o.total_ghs) + Number(o.delivery_fee_ghs))} ·{" "}
                    {PAYMENT[o.payment_status] ?? o.payment_status} ·{" "}
                    {new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" })}
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
