import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { formatGhs } from "@/config/books";
import { fillMissingFees, paymentSetup, quickPaymentsEnabled } from "@/server/quickPayments";
import { setDelivered } from "@/features/admin/cms/quickPaymentActions";
import { BOOK_FORMATS } from "@/config/books";

export const metadata: Metadata = { title: "Payments" };

const STATUS: Record<string, { label: string; cls: string }> = {
  success: { label: "Paid", cls: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" },
  pending: { label: "Not finished", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  failed: { label: "Failed", cls: "bg-black/5 text-foreground/60 dark:bg-white/10" },
  abandoned: { label: "Abandoned", cls: "bg-black/5 text-foreground/60 dark:bg-white/10" },
};

/** Paystack's local (Ghana) fee, used only to estimate when Paystack hasn't told us the real fee yet. */
const ESTIMATED_FEE_RATE = 0.0195;

function money(p: { amount_ghs: number | string; fees_ghs: number | string | null }) {
  const amount = Number(p.amount_ghs);
  const known = p.fees_ghs != null;
  const fee = known ? Number(p.fees_ghs) : Math.round(amount * ESTIMATED_FEE_RATE * 100) / 100;
  return { amount, fee, receive: Math.round((amount - fee) * 100) / 100, known };
}

function Receive({ p }: { p: { amount_ghs: number | string; fees_ghs: number | string | null } }) {
  const m = money(p);
  return (
    <span className="text-xs">
      <span className="font-semibold text-green-800 dark:text-green-300">
        You receive {m.known ? "" : "about "}
        {formatGhs(m.receive)}
      </span>
      <span className="text-foreground/60"> · Paystack fee {formatGhs(m.fee)}</span>
    </span>
  );
}

function Totals({ rows }: { rows: { status: string; amount_ghs: number | string; fees_ghs: number | string | null }[] }) {
  const paid = rows.filter((p) => p.status === "success").map(money);
  if (paid.length === 0) return null;
  const sum = (k: "amount" | "fee" | "receive") => Math.round(paid.reduce((t, m) => t + m[k], 0) * 100) / 100;
  const estimated = paid.some((m) => !m.known);
  return (
    <div className="mt-3 grid max-w-xl grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-black/5 p-3 dark:bg-white/10">
        <p className="text-lg font-bold tabular-nums">{formatGhs(sum("amount"))}</p>
        <p className="text-xs text-foreground/70">People paid</p>
      </div>
      <div className="rounded-xl bg-black/5 p-3 dark:bg-white/10">
        <p className="text-lg font-bold tabular-nums">{formatGhs(sum("fee"))}</p>
        <p className="text-xs text-foreground/70">Paystack fees</p>
      </div>
      <div className="rounded-xl bg-green-100 p-3 text-green-950 dark:bg-green-950 dark:text-green-100">
        <p className="text-lg font-bold tabular-nums">
          {estimated ? "≈ " : ""}
          {formatGhs(sum("receive"))}
        </p>
        <p className="text-xs">You receive</p>
      </div>
    </div>
  );
}

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const admin = await requireAdmin();
  const { show } = await searchParams;
  const paidOnly = show !== "all";
  // Older paid payments: fetch Paystack's real fee once, so "you receive" is exact.
  await fillMissingFees();
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select("id, reference, purpose, book_order_id, payer_name, email, phone, message, amount_ghs, fees_ghs, status, channel, paid_at, created_at, outreaches(title), book_orders(reference)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (paidOnly) query = query.eq("status", "success");
  const { data: payments } = await query;
  let quickQuery = supabase
    .from("quick_payments")
    .select("id, reference, kind, book_title, book_format, quantity, outreach_title, amount_ghs, fees_ghs, status, channel, paid_at, created_at, delivered")
    .order("created_at", { ascending: false })
    .limit(300);
  if (paidOnly) quickQuery = quickQuery.eq("status", "success");
  const { data: quick } = await quickQuery;
  let progQuery = supabase
    .from("programme_payments")
    .select("id, reference, amount_ghs, fees_ghs, status, channel, paid_at, created_at, code_delivered, programme_id, programmes(title)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (paidOnly) progQuery = progQuery.eq("status", "success");
  const { data: prog } = await progQuery;
  const setup = paymentSetup();

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
      <details className="mt-4 max-w-2xl rounded-xl bg-sky-50 p-4 text-sm text-sky-950 dark:bg-white/10 dark:text-white">
        <summary className="cursor-pointer font-semibold">💡 Matching these with your MoMo messages</summary>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
          <li>
            <strong>You receive</strong> = what the person paid minus Paystack&apos;s fee (about 1.95% for MoMo). This is the amount that reaches your MoMo.
          </li>
          <li>Paystack pays it into your MoMo the <strong>next working day</strong>, with all of that day&apos;s payments together in one MoMo message.</li>
          <li>
            The MoMo message shows Paystack&apos;s own reference (e.g. <span className="font-mono">PSTK…</span>), not the website&apos;s{" "}
            <span className="font-mono">ZS-…</span>. To see which payments are inside it, open Payouts on dashboard.paystack.com.
          </li>
        </ul>
      </details>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-foreground/60">Pay-now (books and gifts)</h2>
      {quick && quick.length > 0 && <Totals rows={quick} />}
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
                  {p.status === "success" && <Receive p={p} />}
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

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-foreground/60">Online programmes</h2>
      {prog && prog.length > 0 && <Totals rows={prog} />}
      {!prog?.length ? (
        <p className="mt-3 text-sm text-foreground/60">None yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {prog.map((p) => {
            const s = STATUS[p.status] ?? { label: p.status, cls: "bg-black/5" };
            const title = (p.programmes as unknown as { title: string } | null)?.title ?? "Programme";
            return (
              <li key={p.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
                  <span className="font-semibold">{formatGhs(Number(p.amount_ghs))}</span>
                  <Link href={`/admin/programmes/${p.programme_id}#participants`} className="underline">
                    {title}
                  </Link>
                </span>
                <span className="text-xs text-foreground/60">
                  <span className="font-mono">{p.reference}</span>
                  {p.channel ? ` · ${String(p.channel).replace("_", " ")}` : ""} ·{" "}
                  {new Date(p.paid_at ?? p.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" })}
                  {p.status === "success" && !p.code_delivered ? " · ⚠️ code not shown yet" : ""}
                </span>
                {p.status === "success" && <Receive p={p} />}
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-foreground/60">Orders and gifts with details (when forms are on)</h2>
      {payments && payments.length > 0 && <Totals rows={payments} />}
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
                {p.status === "success" && <Receive p={p} />}
                {p.message && <span className="text-xs italic text-foreground/70">“{p.message}”</span>}
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
