"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { formatGhs } from "@/config/books";
import { payForBook } from "@/features/payments/quickActions";

const key = (slug: string) => `zivarukah-read:${slug}`;

/** Remembers the payment reference on this device, so "Continue reading" works later. */
export function RememberReading({ slug, reference }: { slug: string; reference: string }) {
  useEffect(() => {
    if (!reference) return;
    try {
      localStorage.setItem(key(slug), reference);
    } catch {
      // Private browsing — not remembered.
    }
  }, [slug, reference]);
  return null;
}

/** On the book page: a shortcut back into the reader for people who paid on this device. */
export function ContinueReading({ slug }: { slug: string }) {
  const [reference, setReference] = useState("");
  useEffect(() => {
    try {
      setReference(localStorage.getItem(key(slug)) ?? "");
    } catch {
      setReference("");
    }
  }, [slug]);
  if (!/^Z[SF]-[A-Z0-9]{10}$/.test(reference)) return null;
  return (
    <Link
      href={`/books/${slug}/read?ref=${reference}`}
      className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-brand-on-primary"
    >
      📖 Continue reading
    </Link>
  );
}

export function PayToRead({ slug, price, enabled }: { slug: string; price: number; enabled: boolean }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  if (!enabled) return <p className="text-sm text-foreground/70">Online reading opens as soon as online payment is switched on.</p>;
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError("");
            const result = await payForBook(slug, "read", 1);
            if (result.ok) window.location.assign(result.url);
            else setError(result.message);
          })
        }
        className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-base font-semibold text-brand-on-primary disabled:opacity-50"
      >
        {pending ? "Opening secure payment…" : `Pay ${formatGhs(price)} and read now`}
      </button>
      <p className="text-xs text-foreground/60">Mobile Money (approve with your PIN) or card. The book opens straight after paying, with read-aloud.</p>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
