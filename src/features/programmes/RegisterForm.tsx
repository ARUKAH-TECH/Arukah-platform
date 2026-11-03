"use client";

import { useState } from "react";
import Link from "next/link";
import { registerForProgramme, type RegisterResult } from "@/features/programmes/actions";
import { ShareProgramme } from "@/features/programmes/ShareProgramme";

const field = "mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-[#14110c] dark:border-white/20";

export function RegisterForm({ slug, title, manual, price, when, where, flyerUrl }: { slug: string; title: string; manual: boolean; price?: string; when?: string; where?: string; flyerUrl?: string | null }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+233 ");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await registerForProgramme(slug, name, phone, consent);
      if (r.ok && "payUrl" in r) {
        // Off to Paystack's own page; the code is shown when they come back.
        window.location.href = r.payUrl;
        return;
      }
      setResult(r);
    } catch {
      setResult({ ok: false, message: "Registration couldn't be completed just now. Please check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (result?.ok && "code" in result) {
    const shareText = `My code for "${result.title}" on zivarukah.com: ${result.code}${when ? `\nWhen: ${when}${where ? ` on ${where}` : ""}` : ""}\nOpen: https://zivarukah.com/programmes/access`;
    return (
      <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-5 text-[#14110c] dark:bg-emerald-950 dark:text-white">
        <p className="text-lg font-extrabold">✅ You are registered{result.status === "pending" ? " (waiting for approval)" : ""}!</p>
        {when && (
          <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase text-foreground/60">Programme time</p>
            <p className="mt-1 text-lg font-bold">📅 {when}</p>
            {where && <p className="text-sm">💻 Online on {where}</p>}
          </div>
        )}
        <p className="mt-3 text-sm font-semibold">Your secret code:</p>
        <p className="mt-1 select-all rounded-2xl bg-white p-4 text-center font-mono text-3xl font-black tracking-widest text-[#0b3d91] shadow-inner dark:bg-zinc-900 dark:text-sky-300">
          {result.code}
        </p>
        <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-950">
          ⚠️ Save this code now: take a screenshot or copy it. It is shown only once and is not stored anywhere you can see it again.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => copy(result.code)} className="rounded-full bg-[#0b3d91] px-5 py-2.5 text-sm font-bold text-white">
            {copied ? "✓ Copied" : "📋 Copy code"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-black"
          >
            💬 Save to my WhatsApp
          </a>
        </div>
        <p className="mt-4 text-sm leading-6">
          {result.status === "pending"
            ? "Your place is waiting for approval. Once approved, your code will open the joining details."
            : "Before the programme starts, open the access page and enter your code to see how to join."}
        </p>
        <Link href="/programmes/access" className="mt-3 inline-block rounded-full border border-black/20 px-5 py-2.5 text-sm font-bold dark:border-white/30">
          🔑 Open the access page
        </Link>
        <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="text-sm font-semibold">🙌 Invite your friends to register too</p>
          <div className="mt-2">
            <ShareProgramme slug={slug} title={title} when={when ?? ""} where={where ?? "online"} price={price ?? "Free"} flyerUrl={flyerUrl} compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="block">
        <span className="text-sm font-semibold">Your full name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">WhatsApp number, with country code</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          placeholder="+233 24 123 4567"
          className={field}
        />
        <span className="mt-1 block text-xs text-foreground/60">Ghana: +233 then your number without the first 0. Other countries: your own code.</span>
      </label>
      <label className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-3 text-sm dark:bg-white/5">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 h-5 w-5" />
        <span>
          I agree to receive messages about <strong>{title}</strong> on WhatsApp (confirmation, joining details, reminders and changes). I can ask to stop at any time.
        </span>
      </label>
      {price && (
        <p className="text-xs leading-5 text-foreground/70">
          💳 Next you pay {price} on Paystack&apos;s secure page (Mobile Money or card). Your secret code appears when you come back here after paying.
        </p>
      )}
      {result && !result.ok && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">{result.message}</p>}
      <button type="submit" disabled={busy} className="rounded-full bg-[#0b3d91] px-6 py-3.5 text-base font-bold text-white disabled:opacity-60">
        {busy ? "Please wait…" : price ? `Register and pay ${price}` : manual ? "Request a place" : "Register"}
      </button>
      <p className="text-xs leading-5 text-foreground/60">
        Your name and WhatsApp number are used only for this programme and are seen only by the ZIVARUKAH team. They are never shown on the website.
      </p>
    </form>
  );
}
