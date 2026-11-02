"use client";

import { useState } from "react";
import Link from "next/link";
import { checkProgrammeCode, type AccessResult } from "@/features/programmes/actions";
import { formatTime, formatWhen, platformName } from "@/features/programmes/shared";

const REASONS: Record<string, string> = {
  invalid: "That code was not found. Check each letter and try again (codes look like K7QM2-XH9TA).",
  revoked: "This code has been replaced or stopped. Please contact us on WhatsApp for your new code.",
  expired: "This code has expired because the programme has ended.",
  cancelled: "This programme has been cancelled.",
  pending: "Your registration is still waiting for approval. Please check again later.",
  not_approved: "This registration was not approved. Please contact us on WhatsApp if you think this is a mistake.",
  unpaid: "Payment for this registration has not been confirmed yet.",
  used: "This code has already been used to open the joining details. Please contact us on WhatsApp if you need them again.",
  too_many: "Too many wrong tries. Please wait 15 minutes and try again.",
  error: "The code couldn't be checked just now. Please try again.",
};

export function AccessForm() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AccessResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setResult(await checkProgrammeCode(code));
    } catch {
      setResult({ ok: false, reason: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    const platform = platformName(result.platform, result.platformName);
    return (
      <div className="rounded-3xl border-2 border-emerald-500 bg-white p-5 shadow-md dark:bg-zinc-900">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">✅ Code accepted{result.name ? `. Welcome, ${result.name}!` : ""}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{result.title}</h2>
        <p className="mt-2 text-sm text-foreground/80">
          {result.scheduleNote || `${formatWhen(result.startsAt, result.timeZone)} to ${formatTime(result.endsAt, result.timeZone)}`} · on {platform}
        </p>
        {result.joinLink ? (
          <a
            href={result.joinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#0b3d91] px-6 py-3.5 text-base font-bold text-white"
          >
            ▶️ Join on {platform}
          </a>
        ) : (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">The joining link will be added before the programme starts. Please check again closer to the time.</p>
        )}
        {result.joinInstructions && <p className="mt-4 whitespace-pre-line rounded-xl bg-black/[0.04] p-4 text-sm leading-6 dark:bg-white/10">{result.joinInstructions}</p>}
        {result.singleUse && <p className="mt-3 text-xs font-semibold text-amber-800">This code works only once: keep this page open or note the details now.</p>}
        <p className="mt-4 text-xs text-foreground/60">Please don&apos;t share the joining link. The host may check names before letting people in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="block">
        <span className="text-sm font-semibold">Your secret code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={14}
          placeholder="K7QM2-XH9TA"
          className="mt-1 w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-center font-mono text-2xl font-bold tracking-widest text-[#14110c] dark:border-white/20"
        />
      </label>
      {result && !result.ok && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
          {result.title ? <strong>{result.title}: </strong> : null}
          {REASONS[result.reason] ?? REASONS.invalid}
        </p>
      )}
      <button type="submit" disabled={busy} className="rounded-full bg-[#0b3d91] px-6 py-3.5 text-base font-bold text-white disabled:opacity-60">
        {busy ? "Checking…" : "🔑 Show my joining details"}
      </button>
      <p className="text-center text-sm">
        No code yet? <Link href="/programmes" className="font-semibold underline">See programmes and register</Link>
      </p>
    </form>
  );
}
