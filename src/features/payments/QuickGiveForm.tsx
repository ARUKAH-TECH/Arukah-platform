"use client";

import { useState, useTransition } from "react";
import { giveGift } from "@/features/payments/quickActions";

const PRESETS = [20, 50, 100, 200, 500];

/** Amount → Give → Paystack. No personal details are asked here. */
export function QuickGiveForm({ outreaches, preselect }: { outreaches: { id: string; title: string }[]; preselect: string }) {
  const [amount, setAmount] = useState("50");
  const [outreachId, setOutreachId] = useState(preselect);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function give() {
    setError("");
    startTransition(async () => {
      const result = await giveGift(amount, outreachId);
      if (result.ok) window.location.assign(result.url);
      else setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/15 p-6">
      <div>
        <p className="text-sm font-medium">Amount (GHS)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className={`rounded-full border px-4 py-1.5 text-sm ${amount === String(value) ? "border-brand-primary-text font-semibold" : "border-white/20"}`}
            >
              {value}
            </button>
          ))}
        </div>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="Amount in Ghana cedis"
          className="mt-3 w-full max-w-[12rem] rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-primary-text"
        />
      </div>
      {outreaches.length > 0 && (
        <label className="text-sm font-medium">
          Towards
          <select
            value={outreachId}
            onChange={(event) => setOutreachId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="">Wherever it&apos;s most needed</option>
            {outreaches.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={give}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50"
      >
        {pending ? "Opening secure payment…" : "Give now"}
      </button>
      <p className="text-xs text-white/50">
        You pay on Paystack&apos;s secure page with Mobile Money (approve with your PIN) or card. We don&apos;t ask for your name or number.
      </p>
    </div>
  );
}
