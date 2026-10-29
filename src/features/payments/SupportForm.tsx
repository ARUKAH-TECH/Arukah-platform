"use client";

import { useState, useTransition } from "react";
import { giveToOutreach } from "@/features/payments/actions";

const inputClasses =
  "mt-1 w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-primary-text";
const PRESETS = [20, 50, 100, 200, 500];

export function SupportForm({ outreaches, preselect }: { outreaches: { id: string; title: string }[]; preselect: string }) {
  const [amount, setAmount] = useState("50");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await giveToOutreach(formData);
      if (result.ok) window.location.assign(result.url);
      else setError(result.message);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }} />
      <fieldset>
        <legend className="text-sm font-medium">Amount (GHS)</legend>
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
          name="amount"
          inputMode="decimal"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="Amount in Ghana cedis"
          className={`${inputClasses} max-w-[12rem]`}
        />
      </fieldset>
      {outreaches.length > 0 && (
        <label className="text-sm font-medium">
          Towards
          <select name="outreachId" defaultValue={preselect} className={`${inputClasses} bg-black`}>
            <option value="">Wherever it&apos;s most needed</option>
            {outreaches.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="text-sm font-medium">
        Your name
        <input name="name" required maxLength={150} className={inputClasses} />
      </label>
      <label className="text-sm font-medium">
        Email <span className="font-normal text-white/50">(for your receipt)</span>
        <input name="email" type="email" required maxLength={200} className={inputClasses} />
      </label>
      <label className="text-sm font-medium">
        Phone <span className="font-normal text-white/50">(optional)</span>
        <input name="phone" type="tel" maxLength={40} className={inputClasses} />
      </label>
      <label className="text-sm font-medium">
        Message or prayer request <span className="font-normal text-white/50">(optional)</span>
        <textarea name="message" rows={2} maxLength={1000} className={inputClasses} />
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50"
      >
        {pending ? "Opening secure payment…" : "Continue to secure payment"}
      </button>
      <p className="text-xs text-white/50">
        Paid securely through Paystack: Mobile Money or card. Charged in Ghana cedis (GHS). We never see your card details.
      </p>
    </form>
  );
}
