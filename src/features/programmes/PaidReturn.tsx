"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collectProgrammeCode, type PaidResult } from "@/features/programmes/actions";

/** After Paystack: confirm the payment on the server, then show the secret code once. */
export function PaidReturn({ reference }: { reference: string }) {
  const asked = useRef(false);
  const [result, setResult] = useState<PaidResult | null>(null);
  const [tries, setTries] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    collectProgrammeCode(reference).then(setResult, () => setResult({ state: "pending" }));
  }, [reference]);

  // Mobile Money can take a moment: check again a few times.
  useEffect(() => {
    if (result?.state !== "pending" || tries >= 6) return;
    const t = window.setTimeout(() => {
      setTries((n) => n + 1);
      collectProgrammeCode(reference).then(setResult, () => undefined);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [result, tries, reference]);

  if (!result) return <p className="rounded-2xl bg-black/5 p-5 text-center font-semibold dark:bg-white/10">⏳ Checking your payment with Paystack…</p>;

  if (result.state === "paid") {
    if (!result.code) {
      return (
        <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
          <p className="text-lg font-bold">✅ Payment confirmed for {result.title}.</p>
          <p className="mt-2 text-sm leading-6">
            Your secret code was already shown on this page earlier. If you didn&apos;t save it, message us on WhatsApp and we will send you a new one.
          </p>
          <Link href="/programmes/access" className="mt-3 inline-block rounded-full bg-[#0b3d91] px-5 py-2.5 text-sm font-bold text-white">
            🔑 Enter my code
          </Link>
        </div>
      );
    }
    const shareText = `My code for "${result.title}" on zivarukah.com: ${result.code}${result.when ? `\nWhen: ${result.when}` : ""}\nOpen: https://zivarukah.com/programmes/access`;
    return (
      <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-5 text-[#14110c] dark:bg-emerald-950 dark:text-white">
        <p className="text-lg font-extrabold">✅ Payment confirmed. You are registered{result.approved ? "" : " (waiting for approval)"}!</p>
        <p className="mt-1 text-sm">{result.title}</p>
        {result.when && (
          <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase text-foreground/60">Programme time</p>
            <p className="mt-1 text-lg font-bold">📅 {result.when}</p>
            {result.where && <p className="text-sm">💻 Online on {result.where}</p>}
          </div>
        )}
        <p className="mt-3 text-sm font-semibold">Your secret code:</p>
        <p className="mt-1 select-all rounded-2xl bg-white p-4 text-center font-mono text-3xl font-black tracking-widest text-[#0b3d91] shadow-inner dark:bg-zinc-900 dark:text-sky-300">
          {result.code}
        </p>
        <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-950">⚠️ Save this code now: take a screenshot or copy it. It is shown only once.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(result.code!).then(() => setCopied(true), () => undefined)}
            className="rounded-full bg-[#0b3d91] px-5 py-2.5 text-sm font-bold text-white"
          >
            {copied ? "✓ Copied" : "📋 Copy code"}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-black">
            💬 Save to my WhatsApp
          </a>
        </div>
        <Link href="/programmes/access" className="mt-4 inline-block rounded-full border border-black/20 px-5 py-2.5 text-sm font-bold dark:border-white/30">
          🔑 Open the access page
        </Link>
      </div>
    );
  }

  const messages: Record<string, string> = {
    pending: "Your payment is not confirmed yet. If you approved it on your phone, wait a moment and refresh this page.",
    failed: "The payment did not go through. You can go back to the programme and try again with the same WhatsApp number.",
    unknown: "We couldn't find this payment. If money left your account, please contact us on WhatsApp with the time you paid.",
    refunded: "This payment was refunded.",
    cancelled: "This payment was cancelled.",
  };
  return (
    <div className="rounded-2xl bg-amber-50 p-5 text-amber-950 dark:bg-white/10 dark:text-white">
      <p className="font-semibold">{messages[result.state]}</p>
      {result.state === "pending" && tries < 6 && <p className="mt-2 text-sm">Checking again automatically…</p>}
      <Link href="/programmes" className="mt-3 inline-block text-sm font-semibold underline">
        Back to programmes
      </Link>
    </div>
  );
}
