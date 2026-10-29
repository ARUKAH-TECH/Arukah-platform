"use client";

import { setPreferredCurrency, useLocalCurrency } from "@/features/currency/ApproxPrice";

const CHOICES = ["GHS", "USD", "GBP", "EUR", "CAD", "NGN", "ZAR", "KES", "XOF", "AUD"];

/** A small line under prices: what the ≈ amounts mean, and a currency picker. */
export function CurrencyNote() {
  const local = useLocalCurrency();
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground/60">
      <span>Prices are in Ghana cedis (GHS).{local.currency ? ` ≈ amounts in ${local.currency} are a guide only.` : ""}</span>
      <label className="flex items-center gap-1">
        Show approx. in
        <select
          value={local.currency ?? "GHS"}
          onChange={(event) => setPreferredCurrency(event.target.value)}
          className="rounded border border-black/15 bg-transparent px-1 py-0.5 dark:border-white/15"
        >
          {CHOICES.map((code) => (
            <option key={code} value={code}>
              {code === "GHS" ? "GHS only" : code}
            </option>
          ))}
        </select>
      </label>
    </p>
  );
}
