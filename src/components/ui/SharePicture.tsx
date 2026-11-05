"use client";

import { useEffect, useRef, useState } from "react";

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
  const ref = useRef<HTMLButtonElement>(null);
  const ready = useRef<{ url: string; blob: Promise<Blob> } | null>(null);

  // Start making the picture as soon as the button is on screen, so tapping
  // it is instant (and the phone still treats the share as the user's tap).
  const load = () => {
    if (ready.current?.url !== image) {
      const blob = fetch(image).then((res) => {
        if (!res.ok) throw new Error("picture");
        return res.blob();
      });
      blob.catch(() => {
        if (ready.current?.url === image) ready.current = null; // try again on tap
      });
      ready.current = { url: image, blob };
    }
    return ready.current.blob;
  };
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        load();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  async function go() {
    if (state === "busy") return;
    setState("busy");
    try {
      const blob = await load();
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
      <button ref={ref} type="button" onClick={go} disabled={state === "busy"} className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition hover:scale-105 disabled:opacity-60 ${style}`}>
        {state === "busy" ? "⏳ Making picture…" : "🖼 Share picture"}
      </button>
      {state === "saved" && <span className={`mt-1 text-xs ${dark ? "text-white/70" : "text-foreground/60"}`}>Picture saved to your phone: attach it in WhatsApp or Status.</span>}
      {state === "failed" && <span className="mt-1 text-xs text-rose-600">Couldn&apos;t make the picture. Check your internet and try again.</span>}
    </span>
  );
}
