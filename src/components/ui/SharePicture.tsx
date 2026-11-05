"use client";

import { useState } from "react";

// "Share picture": fetches a ready-made picture (logo + verse/quote) and opens
// the phone's share sheet with it (WhatsApp chat or Status, Facebook…).
// Phones that can't share files save the picture instead.

interface SharePictureProps {
  /** Address of the picture, e.g. /api/share-card?quote=today */
  image: string;
  /** Text sent with the picture (where the app allows it). */
  text: string;
  fileName?: string;
  dark?: boolean;
  className?: string;
}

export function SharePicture({ image, text, fileName = "repent-online-ministries.png", dark = false, className = "" }: SharePictureProps) {
  const [state, setState] = useState<"idle" | "busy" | "saved" | "failed">("idle");

  async function go() {
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch(image);
      if (!res.ok) throw new Error("picture");
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], text });
          setState("idle");
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            setState("idle");
            return;
          }
          // Share not allowed here: save the picture instead.
        }
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
      setState("saved");
    } catch {
      setState("failed");
    }
  }

  const style = dark ? "border-[#e3a82a] text-[#f0c050]" : "border-brand-primary-text text-brand-primary-text";
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <button type="button" onClick={go} disabled={state === "busy"} className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition hover:scale-105 disabled:opacity-60 ${style}`}>
        {state === "busy" ? "⏳ Making picture…" : "🖼 Share picture"}
      </button>
      {state === "saved" && <span className={`mt-1 text-xs ${dark ? "text-white/70" : "text-foreground/60"}`}>Picture saved to your phone: attach it in WhatsApp or Status.</span>}
      {state === "failed" && <span className="mt-1 text-xs text-rose-600">Couldn&apos;t make the picture. Check your internet and try again.</span>}
    </span>
  );
}
