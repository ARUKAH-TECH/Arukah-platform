"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { formatGhs } from "@/config/books";
import { basketTotals, onBasketChange, readBasket, writeBasket, type BasketItem } from "@/features/books/basket";
import { placeBookOrder, type OrderState } from "@/features/books/orderActions";
import { PayOrderNow } from "@/features/payments/PayOrderNow";
import { ApproxPrice } from "@/features/currency/ApproxPrice";
import { CurrencyNote } from "@/features/currency/CurrencyNote";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-primary-text dark:border-white/15";

export function Basket({ afterOrderText, payOnline }: { afterOrderText: string; payOnline: boolean }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [fulfilment, setFulfilment] = useState("collection");
  const [state, setState] = useState<OrderState>({ status: "idle", message: "" });
  const [pending, startTransition] = useTransition();
  const [orderEmail, setOrderEmail] = useState("");

  useEffect(() => {
    const update = () => setItems(readBasket());
    update();
    setLoaded(true);
    return onBasketChange(update);
  }, []);

  if (state.status === "success" && state.reference) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-green-950 dark:bg-green-950 dark:text-green-100">
        <p className="text-sm font-semibold">Thank you: your order has been received.</p>
        <p className="mt-3 text-sm">
          Your order number is <span className="font-mono text-lg font-bold">{state.reference}</span>. Please keep it.
        </p>
        {payOnline && <PayOrderNow orderReference={state.reference} email={orderEmail} />}
        <p className="mt-3 text-sm whitespace-pre-line">{afterOrderText}</p>
        <Link href="/books" className="mt-4 inline-block text-sm font-semibold underline">
          Back to books
        </Link>
      </div>
    );
  }

  if (!loaded) return null;
  if (items.length === 0) {
    return (
      <p className="text-sm text-foreground/70">
        Your basket is empty.{" "}
        <Link href="/books" className="font-semibold text-brand-primary-text underline">
          Browse books
        </Link>
      </p>
    );
  }

  const totals = basketTotals(items);
  const hasPrint = items.some((item) => item.format === "print");

  function update(index: number, quantity: number) {
    const next = [...items];
    if (quantity <= 0) next.splice(index, 1);
    else next[index] = { ...next[index], quantity: Math.min(50, quantity) };
    writeBasket(next);
  }

  function submit(formData: FormData) {
    setOrderEmail(String(formData.get("email") ?? ""));
    formData.set("items", JSON.stringify(items.map(({ bookId, format, quantity }) => ({ bookId, format, quantity }))));
    startTransition(async () => {
      const result = await placeBookOrder(formData);
      if (result.status === "success") writeBasket([]);
      setState(result);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <ul className="flex flex-col divide-y divide-black/10 rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/10">
          {items.map((item, index) => (
            <li key={`${item.bookId}-${item.format}`} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/books/${item.slug}`} className="font-medium hover:text-brand-primary-text">
                  {item.title}
                </Link>
                <p className="text-xs text-foreground/60">
                  {item.formatLabel} · {formatGhs(item.unitPrice)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="One less" onClick={() => update(index, item.quantity - 1)} className="h-8 w-8 rounded-full border border-black/15 dark:border-white/15">
                  −
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button type="button" aria-label="One more" onClick={() => update(index, item.quantity + 1)} className="h-8 w-8 rounded-full border border-black/15 dark:border-white/15">
                  +
                </button>
              </div>
              <span className="w-28 text-right font-semibold">{formatGhs(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal ({totals.count} book{totals.count === 1 ? "" : "s"})</dt>
            <dd>{formatGhs(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-green-700 dark:text-green-400">
              <dt>10% off (more than 3 books)</dt>
              <dd>−{formatGhs(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>
              {formatGhs(totals.total)}
              <ApproxPrice ghs={totals.total} className="text-sm" />
            </dd>
          </div>
        </dl>
        <CurrencyNote />
        {hasPrint && <p className="mt-2 text-xs text-foreground/60">Any delivery charge for printed copies is confirmed with you.</p>}
        {totals.count <= 3 && <p className="mt-2 text-xs text-foreground/60">Add {4 - totals.count} more to get 10% off.</p>}
      </div>

      <form action={submit} className="flex flex-col gap-4 lg:col-span-2">
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-primary-text">Your details</h2>
        <label className="text-sm font-medium">
          Name
          <input name="name" required maxLength={150} className={inputClasses} />
        </label>
        <label className="text-sm font-medium">
          Phone / WhatsApp
          <input name="phone" type="tel" maxLength={40} className={inputClasses} />
        </label>
        <label className="text-sm font-medium">
          Email <span className="font-normal text-foreground/60">(optional)</span>
          <input name="email" type="email" maxLength={200} className={inputClasses} />
        </label>

        {hasPrint && (
          <fieldset>
            <legend className="text-sm font-medium">Printed copies</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="fulfilment" value="collection" checked={fulfilment === "collection"} onChange={() => setFulfilment("collection")} />
                I&apos;ll collect
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="fulfilment" value="delivery" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} />
                Deliver to me
              </label>
            </div>
            {fulfilment === "delivery" && (
              <label className="mt-3 block text-sm font-medium">
                Delivery address
                <textarea name="address" required rows={2} maxLength={500} className={inputClasses} />
              </label>
            )}
          </fieldset>
        )}

        <label className="text-sm font-medium">
          Note <span className="font-normal text-foreground/60">(optional)</span>
          <textarea name="note" rows={2} maxLength={1000} className={inputClasses} />
        </label>

        {state.status === "error" && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50"
        >
          {pending ? "Placing order…" : `Place order · ${formatGhs(totals.total)}`}
        </button>
        <p className="text-xs text-foreground/60">
          {payOnline
            ? "After placing the order you can pay securely online (Mobile Money or card), or pay later when we contact you."
            : "No payment is taken online. We'll contact you to confirm and arrange payment."}
        </p>
      </form>
    </div>
  );
}
