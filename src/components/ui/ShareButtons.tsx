"use client";

import { useEffect, useState } from "react";

// One-tap sharing. WhatsApp first (that's how things spread here), then the
// phone's own share sheet (Status, Telegram, SMS…) and "Copy link".
// Nothing is tracked or sent to us.

interface ShareButtonsProps {
  url: string;
  /** Short title for the phone's share sheet. */
  title: string;
  /** The WhatsApp message (WhatsApp *bold* works). The link is added at the end. */
  message: string;
  label?: string;
  dark?: boolean;
  className?: string;
}

export function ShareButtons({ url, title, message, label = "Share", dark = false, className = "" }: ShareButtonsProps) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const full = `${message}\n\n${url}`;
  const outline = dark ? "border-white/30 text-white" : "border-black/15 dark:border-white/15";

  async function nativeShare() {
    try {
      await navigator.share({ title, text: message, url });
    } catch {
      // cancelled — nothing to do
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <span className={`font-semibold ${dark ? "text-white" : ""}`}>{label}:</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(full)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 font-semibold text-black shadow-sm transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
          <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3a8.2 8.2 0 1 1 6.9 3.8Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
        </svg>
        WhatsApp
      </a>
      {canShare && (
        <button type="button" onClick={nativeShare} className={`rounded-full border px-4 py-2 font-medium transition hover:scale-105 ${outline}`}>
          📤 More…
        </button>
      )}
      <button type="button" onClick={copy} className={`rounded-full border px-4 py-2 font-medium transition hover:scale-105 ${outline}`}>
        {copied ? "✅ Copied" : "🔗 Copy link"}
      </button>
    </div>
  );
}
