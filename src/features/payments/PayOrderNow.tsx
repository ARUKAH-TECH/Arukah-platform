"use client";

import { useState, useTransition } from "react";
import { payForBookOrder } from "@/features/payments/actions";

/** Shown after an order is placed, when online payment is switched on. */
export function PayOrderNow({ orderReference, email }: { orderReference: string; email: string }) {
  const [mail, setMail] = useState(email);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function pay() {
    setError("");
    startTransition(async () => {
      const result = await payForBookOrder(orderReference, mail);
      if (result.ok) window.location.assign(result.url);
      else setError(result.message);
    });
  }

  return (
    <div className="mt-5 rounded-xl bg-white/70 p-4 text-foreground dark:bg-black/30">
      <p className="text-sm font-semibold">Pay now online (optional)</p>
      <label className="mt-2 block text-xs">
        Email for your receipt
        <input
          type="email"
          value={mail}
          maxLength={200}
          onChange={(event) => setMail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/15"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={pending}
        className="mt-3 inline-flex rounded-full bg-brand-primary px-5 py-2 text-sm font-medium text-brand-on-primary disabled:opacity-50"
      >
        {pending ? "Opening secure payment…" : "Pay with Mobile Money or card"}
      </button>
      <p className="mt-2 text-xs opacity-70">Secure payment by Paystack, in Ghana cedis. You can also pay later when we contact you.</p>
    </div>
  );
}
