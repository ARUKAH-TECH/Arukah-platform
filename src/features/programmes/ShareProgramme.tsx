"use client";

import { useState } from "react";

// "Invite friends": shares the programme FLYER (the picture itself) together
// with the text and link, through the phone's share sheet (WhatsApp, Status,
// Facebook…). Phones that can't share pictures get a WhatsApp message with the
// link instead, whose preview shows the flyer.

export function ShareProgramme({
  slug,
  title,
  when,
  where,
  price,
  flyerUrl,
  dark = false,
  compact = false,
}: {
  slug: string;
  title: string;
  when: string;
  where: string;
  price: string;
  flyerUrl?: string | null;
  dark?: boolean;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = `https://zivarukah.com/programmes/${slug}`;
  const text = `🎓 *${title}*\n📅 ${when}\n💻 Online on ${where} · ${price}\n\nRegister on zivarukah.com to get your special code 👇\n${link}`;
  const waText = `${text}?utm_source=whatsapp`;

  async function share() {
    setBusy(true);
    try {
      if (flyerUrl && typeof navigator.share === "function") {
        try {
          const res = await fetch(flyerUrl);
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], `${slug}-flyer.jpg`, { type: blob.type || "image/jpeg" });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ files: [file], text, title });
              return;
            }
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return; // they closed the share sheet
        }
      }
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title, text, url: link });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank", "noopener");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", link);
    }
  }

  const outline = dark ? "border-white/30 text-white" : "border-black/15 dark:border-white/20";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-1"}`}>
      <button type="button" onClick={share} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-black shadow-sm disabled:opacity-60">
        📣 {busy ? "Preparing the flyer…" : "Invite friends"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-full border px-4 py-2.5 text-sm font-semibold ${outline}`}
      >
        💬 WhatsApp text
      </a>
      <button type="button" onClick={copy} className={`rounded-full border px-4 py-2.5 text-sm font-semibold ${outline}`}>
        {copied ? "✅ Copied" : "🔗 Copy link"}
      </button>
    </div>
  );
}
