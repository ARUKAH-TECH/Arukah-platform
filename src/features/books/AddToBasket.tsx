"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatGhs, type BookFormat } from "@/config/books";
import { addToBasket, onBasketChange, readBasket } from "@/features/books/basket";
import { ApproxPrice } from "@/features/currency/ApproxPrice";
import { CurrencyNote } from "@/features/currency/CurrencyNote";
import { ONLINE_FORMS_ENABLED, whatsappLink } from "@/config/forms";

interface Props {
  book: { id: string; slug: string; title: string };
  prices: { format: BookFormat; label: string; amount: number }[];
}

export function AddToBasket({ book, prices }: Props) {
  const [format, setFormat] = useState<BookFormat>(prices[0]?.format ?? "read");
  const [quantity, setQuantity] = useState(1);
  const [count, setCount] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const update = () => setCount(readBasket().reduce((sum, item) => sum + item.quantity, 0));
    update();
    return onBasketChange(update);
  }, []);

  if (prices.length === 0) return null;
  const chosen = prices.find((price) => price.format === format) ?? prices[0];

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-sm font-medium">Choose a format</legend>
        <div className="mt-2 flex flex-col gap-2">
          {prices.map((price) => (
            <label
              key={price.format}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                format === price.format ? "border-brand-primary-text" : "border-black/10 dark:border-white/10"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value={price.format}
                  checked={format === price.format}
                  onChange={() => {
                    setFormat(price.format);
                    setAdded(false);
                  }}
                />
                {price.label}
              </span>
              <span className="text-right font-semibold">
                {formatGhs(price.amount)}
                <ApproxPrice ghs={price.amount} className="block text-xs" />
              </span>
            </label>
          ))}
        </div>
        <CurrencyNote />
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">
          Quantity
          <input
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
            className="mt-1 block w-20 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          />
        </label>
        {ONLINE_FORMS_ENABLED ? (
        <button
          type="button"
          onClick={() => {
            addToBasket({
              bookId: book.id,
              slug: book.slug,
              title: book.title,
              format: chosen.format,
              formatLabel: chosen.label,
              unitPrice: chosen.amount,
              quantity,
            });
            setAdded(true);
          }}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-brand-on-primary hover:bg-brand-primary-hover"
        >
          Add to basket
        </button>
        ) : (
          <a
            href={whatsappLink(
              `Hello ZIVARUKAH BOOKS, I would like to order:\n${quantity} × "${book.title}" (${chosen.label}) — ${formatGhs(chosen.amount * quantity)}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
          >
            Order on WhatsApp
          </a>
        )}
      </div>

      {ONLINE_FORMS_ENABLED && (added || count > 0) && (
        <p className="text-sm">
          {added && <span className="text-green-700 dark:text-green-400">Added. </span>}
          <Link href="/books/basket" className="font-semibold text-brand-primary-text underline">
            View basket ({count})
          </Link>
        </p>
      )}
      <p className="text-xs text-foreground/50">
        Buy more than 3 books in one order and get 10% off.
        {!ONLINE_FORMS_ENABLED && " We confirm your order and how to pay on WhatsApp."}
      </p>
    </div>
  );
}
