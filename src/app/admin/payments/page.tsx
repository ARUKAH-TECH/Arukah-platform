import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { formatGhs } from "@/config/books";
import { paymentsEnabled } from "@/server/payments";

export const metadata: Metadata = { title: "Payments" };

const STATUS: Record<string, { label: string; cls: string }> = {
  success: { label: "Paid", cls: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" },
  pending: { label: "Not finished", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  failed: { label: "Failed", cls: "bg-black/5 text-foreground/50 dark:bg-white/10" },
  abandoned: { label: "Abandoned", cls: "bg-black/5 text-foreground/50 dark:bg-white/10" },
};

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const admin = await requireAdmin();
  const { show } = await searchParams;
  const paidOnly = show !== "all";
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select("id, reference, purpose, book_order_id, payer_name, email, phone, message, amount_ghs, status, channel, paid_at, created_at, outreaches(title), book_orders(reference)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (paidOnly) query = query.eq("status", "success");
  const { data: payments } = await query;
  const total = (payments ?? []).filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount_ghs), 0);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Online payments</h1>
      {!paymentsEnabled() && (
        <p className="mt-3 max-w-2xl rounded-xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          Online payment is switched off. It turns on when PAYSTACK_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY are added in Vercel (see
          docs/PAYMENTS.md). Until then visitors pay by Mobile Money as before.
        </p>
      )}
      <nav className="mt-4 flex gap-2 text-sm">
        <Link href="/admin/payments" className={`rounded-full border px-3 py-1 ${paidOnly ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}>
          Paid
        </Link>
        <Link href="/admin/payments?show=all" className={`rounded-full border px-3 py-1 ${!paidOnly ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}>
          All attempts
        </Link>
      </nav>
      {payments && payments.length > 0 && <p className="mt-4 text-sm text-foreground/70">Paid in this list: <strong>{formatGhs(total)}</strong></p>}
      {!payments?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No payments here yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {payments.map((p) => {
            const s = STATUS[p.status] ?? { label: p.status, cls: "" };
            const outreach = (p.outreaches as unknown as { title: string } | null)?.title;
            const order = (p.book_orders as unknown as { reference: string } | null)?.reference;
            return (
              <li key={p.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
                  <span className="font-semibold">{formatGhs(Number(p.amount_ghs))}</span>
                  <span>{p.payer_name || p.email}</span>
                  {p.channel && <span className="text-xs text-foreground/50">({p.channel.replace("_", " ")})</span>}
                </span>
                <span className="text-xs text-foreground/60">
                  {p.purpose === "book_order" ? (
                    p.book_order_id ? (
                      <Link href={`/admin/book-orders/${p.book_order_id}`} className="underline">
                        Book order {order}
                      </Link>
                    ) : (
                      "Book order"
                    )
                  ) : (
                    <>Outreach gift{outreach ? ` — ${outreach}` : " — general"}</>
                  )}{" "}
                  · {p.email}
                  {p.phone ? ` · ${p.phone}` : ""} · {p.reference} ·{" "}
                  {new Date(p.paid_at ?? p.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" })}
                </span>
                {p.message && <span className="text-xs italic text-foreground/70">“{p.message}”</span>}
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
