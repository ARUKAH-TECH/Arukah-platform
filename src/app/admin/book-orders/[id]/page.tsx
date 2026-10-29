import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { BookOrderForm } from "@/features/admin/cms/BookOrderForm";
import { deleteBookOrder } from "@/features/admin/cms/bookOrderActions";
import { BOOK_FORMATS, formatGhs } from "@/config/books";

export const metadata: Metadata = { title: "Book order" };

const FULFILMENT: Record<string, string> = { delivery: "Deliver", collection: "Collect", digital: "Digital only (no delivery)" };

export default async function BookOrderPage({ params }: PageProps<"/admin/book-orders/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: o }, { data: items }] = await Promise.all([
    supabase.from("book_orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("book_order_items").select("id, book_title, format, quantity, unit_price_ghs, line_total_ghs").eq("order_id", id),
  ]);
  if (!o) notFound();

  const formatLabel = (f: string) => BOOK_FORMATS.find((x) => x.id === f)?.label ?? f;
  const grandTotal = Number(o.total_ghs) + Number(o.delivery_fee_ghs);
  const paid = o.amount_paid_ghs != null ? Number(o.amount_paid_ghs) : 0;
  const digits = String(o.phone).replace(/[^\d+]/g, "");
  const whatsapp = digits.startsWith("+") ? digits.slice(1) : digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  const hasPrint = (items ?? []).some((item) => item.format === "print");

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/book-orders" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All orders
      </Link>
      <h1 className="mt-2 font-mono text-2xl font-bold">{o.reference}</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Accra" })}
      </p>

      <div className="mt-8 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-zinc-900">
          <div>
            <p className="font-medium">{o.customer_name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {o.phone && (
                <>
                  <a href={`tel:${digits}`} className="rounded-full bg-brand-primary px-4 py-1.5 text-xs font-medium text-brand-on-primary">
                    Call {o.phone}
                  </a>
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello ${o.customer_name}, about your ZIVARUKAH BOOKS order ${o.reference}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium dark:border-white/15"
                  >
                    WhatsApp
                  </a>
                </>
              )}
              {o.email && (
                <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your order ${o.reference}`)}`} className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium dark:border-white/15">
                  Email
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-foreground/60">Books</p>
            <ul className="mt-2 flex flex-col gap-2">
              {(items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.quantity} × {item.book_title}
                    <span className="block text-xs text-foreground/60">
                      {formatLabel(item.format)} · {formatGhs(Number(item.unit_price_ghs))} each
                    </span>
                  </span>
                  <span className="font-medium">{formatGhs(Number(item.line_total_ghs))}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-3 dark:border-white/10">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatGhs(Number(o.subtotal_ghs))}</dd></div>
              {Number(o.discount_ghs) > 0 && (
                <div className="flex justify-between text-green-700 dark:text-green-400"><dt>10% off</dt><dd>−{formatGhs(Number(o.discount_ghs))}</dd></div>
              )}
              {Number(o.delivery_fee_ghs) > 0 && (
                <div className="flex justify-between"><dt>Delivery</dt><dd>{formatGhs(Number(o.delivery_fee_ghs))}</dd></div>
              )}
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatGhs(grandTotal)}</dd></div>
              {paid > 0 && (
                <div className="flex justify-between text-xs text-foreground/60"><dt>Paid so far</dt><dd>{formatGhs(paid)} · balance {formatGhs(Math.max(0, grandTotal - paid))}</dd></div>
              )}
            </dl>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-foreground/60">How they get it</p>
            <p className="mt-1">{FULFILMENT[o.fulfilment] ?? o.fulfilment}</p>
            {o.address && <p className="mt-1 whitespace-pre-line text-foreground/80">{o.address}</p>}
          </div>
          {o.customer_note && (
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/60">Their note</p>
              <p className="mt-1 whitespace-pre-line">{o.customer_note}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <BookOrderForm
            values={{
              id: o.id,
              status: o.status,
              paymentStatus: o.payment_status,
              amountPaid: o.amount_paid_ghs != null ? String(o.amount_paid_ghs) : "",
              deliveryFee: Number(o.delivery_fee_ghs) > 0 ? String(o.delivery_fee_ghs) : "",
              paymentReference: o.payment_reference,
              adminNote: o.admin_note,
              hasPrint,
            }}
          />
        </section>
      </div>

      <section className="mt-12 max-w-5xl border-t border-black/10 pt-8 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this order…</summary>
          <p className="mt-2 text-xs text-foreground/60">Usually better to mark it Cancelled so you keep a record.</p>
          <form action={deleteBookOrder} className="mt-3">
            <input type="hidden" name="id" value={o.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}
