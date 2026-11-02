"use client";

import { useState } from "react";
import { logProgrammeMessage, reissueRegistrationCode } from "@/features/admin/cms/programmeActions";

/** "New code" button: shows the new code once, with a ready WhatsApp message to send it. */
export function ReissueCode({ id, programmeId, phone, name, title }: { id: string; programmeId: string; phone: string; name: string; title: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: true; code: string } | { ok: false; message: string } | null>(null);

  async function run() {
    if (!window.confirm(`Make a new code for ${name}? Their old code will stop working.`)) return;
    setBusy(true);
    try {
      setResult(await reissueRegistrationCode(id, programmeId));
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    const text = `Hello ${name.split(" ")[0]}, your new code for "${title}" is ${result.code}\n\nEnter it at https://zivarukah.com/programmes/access to see how to join.`;
    return (
      <div className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
        New code (shown only now): <strong className="font-mono text-base tracking-widest">{result.code}</strong>
        <a
          href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`}
          onClick={() => void logProgrammeMessage(id, programmeId, "code")}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 inline-block rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-black"
        >
          💬 Send on WhatsApp
        </a>
        <p className="mt-1 text-xs opacity-80">Opening WhatsApp does not confirm the message was delivered.</p>
      </div>
    );
  }
  return (
    <>
      <button type="button" onClick={run} disabled={busy} className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium dark:border-white/15">
        {busy ? "…" : "🔄 New code"}
      </button>
      {result && !result.ok && <span className="text-xs text-red-700">{result.message}</span>}
    </>
  );
}

/** A prepared WhatsApp message: opens the chat with the text typed in, and records "opened". */
export function MessageButton({
  registrationId,
  programmeId,
  kind,
  label,
  href,
  opened,
}: {
  registrationId: string;
  programmeId: string;
  kind: string;
  label: string;
  href: string;
  opened?: string;
}) {
  const [justOpened, setJustOpened] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setJustOpened(true);
        void logProgrammeMessage(registrationId, programmeId, kind);
      }}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        opened || justOpened ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-[#25D366] text-black"
      }`}
    >
      💬 {label}
      {opened || justOpened ? ` · opened${opened ? ` ${opened}` : ""}` : ""}
    </a>
  );
}
