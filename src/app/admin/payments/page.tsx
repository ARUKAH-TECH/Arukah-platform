import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { formatGhs } from "@/config/books";
import { paymentSetup, quickPaymentsEnabled } from "@/server/quickPayments";
import { setDelivered } from "@/features/admin/cms/quickPaymentActions";
import { BOOK_FORMATS } from "@/config/books";

export const metadata: Metadata = { title: "Payments" };

const STATUS: Record<string, { label: string; cls: string }> = {
  success: { label: "Paid", cls: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" },
  pending: { label: "Not finished", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  failed: { label: "Failed", cls: "bg-black/5 text-foreground/60 dark:bg-white/10" },
  abandoned: { label: "Abandoned", cls: "bg-black/5 text-foreground/60 dark:bg-white/10" },
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
  let quickQuery = supabase
    .from("quick_payments")
    .select("id, reference, kind, book_title, book_format, quantity, outreach_title, amount_ghs, status, channel, paid_at, created_at, delivered")
    .order("created_at", { ascending: false })
    .limit(300);
  if (paidOnly) quickQuery = quickQuery.eq("status", "success");
  const { data: quick } = await quickQuery;
  const quickTotal = (quick ?? []).filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount_ghs), 0);
  const setup = paymentSetup();
  const total = (payments ?? []).filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount_ghs), 0);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Online payments</h1>
      <div
        className={`mt-3 max-w-2xl rounded-xl p-4 text-sm ${
          quickPaymentsEnabled() ? "bg-green-50 text-green-950 dark:bg-green-950 dark:text-green-100" : "bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
        }`}
      >
        <p className="font-semibold">
          {quickPaymentsEnabled() ? "✅ Online payment is ON" : "Online payment is OFF: visitors see a “being set up” note instead."}
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {[
            [setup.paystackKey, "PAYSTACK_SECRET_KEY is set"],
            [setup.paystackLive, "…and it is a LIVE key (starts with sk_live_)"],
            [setup.receiptEmail, "PAYSTACK_RECEIPT_EMAIL is a valid email address"],
            [setup.siteUrl, "SITE_URL starts with https:// (e.g. https://zivarukah.com)"],
            [setup.serviceKey, "SUPABASE_SERVICE_ROLE_KEY is set"],
            [setup.serviceKeyRole, "…and it is the service_role (secret) key, not the anon/public key"],
          ].map(([ok, label]) => (
            <li key={String(label)}>
              {ok ? "✅" : "❌"} {label}
            </li>
          ))}
        </ul>
        {!quickPaymentsEnabled() && <p className="mt-2">Fix any ❌ in Vercel → Settings → Environment Variables, then redeploy.</p>}
      </div>
      <nav className="mt-4 flex gap-2 text-sm">
        <Link href="/admin/payments" className={`rounded-full border px-3 py-1 ${paidOnly ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}>
          Paid
        </Link>
        <Link href="/admin/payments?show=all" className={`rounded-full border px-3 py-1 ${!paidOnly ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}>
          All attempts
        </Link>
      </nav>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-foreground/60">Pay-now (books and gifts)</h2>
      {quick && quick.length > 0 && <p className="mt-2 text-sm text-foreground/70">Paid in this list: <strong>{formatGhs(quickTotal)}</strong></p>}
      {!quick?.length ? (
        <p className="mt-3 text-sm text-foreground/60">None yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {quick.map((p) => {
            const s = STATUS[p.status] ?? { label: p.status, cls: "" };
            const format = BOOK_FORMATS.find((f) => f.id === p.book_format)?.label ?? "";
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
                    <span className="font-semibold">{formatGhs(Number(p.amount_ghs))}</span>
                    <span>
                      {p.kind === "book" ? `${p.quantity} × ${p.book_title} (${format})` : `Gift${p.outreach_title ? `: ${p.outreach_title}` : ": general"}`}
                    </span>
                  </span>
                  <span className="text-xs text-foreground/60">
                    <span className="font-mono">{p.reference}</span>
                    {p.channel ? ` · ${String(p.channel).replace("_", " ")}` : ""} ·{" "}
                    {new Date(p.paid_at ?? p.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" })}
                  </span>
                </span>
                {p.kind === "book" && p.status === "success" && (
                  <form action={setDelivered}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="delivered" value={p.delivered ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        p.delivered ? "border-green-600 text-green-700 dark:text-green-400" : "border-black/15 dark:border-white/15"
                      }`}
                    >
                      {p.delivered ? "✓ Sent" : "Mark as sent"}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-foreground/60">Orders and gifts with details (when forms are on)</h2>
      {payments && payments.length > 0 && <p className="mt-4 text-sm text-foreground/70">Paid in this list: <strong>{formatGhs(total)}</strong></p>}
      {!payments?.length ? (
        <p className="mt-3 text-sm text-foreground/60">None yet.</p>
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
                  {p.channel && <span className="text-xs text-foreground/60">({p.channel.replace("_", " ")})</span>}
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
                    <>Outreach gift{outreach ? `: ${outreach}` : ": general"}</>
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
