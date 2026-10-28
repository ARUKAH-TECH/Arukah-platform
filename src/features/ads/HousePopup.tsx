"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HouseAd } from "./houseAds";

// The "our works" pop-up. A few seconds after a page opens it asks the server
// whether the pop-up window is on (the 48 hours that follow 5 days without a
// paid advert). Each visitor sees it at most once per visit; it closes with
// ✕, Escape or a tap outside.

export function HousePopup() {
  const [ads, setAds] = useState<HouseAd[]>([]);
  const [seconds, setSeconds] = useState(15);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Open any page with ?works-popup=preview to see the pop-up straight away.
    const preview = new URLSearchParams(window.location.search).get("works-popup") === "preview";
    try {
      if (!preview && sessionStorage.getItem("zv-works-popup")) return;
    } catch {
      // storage blocked: still check once on this page
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/works-popup${preview ? "?preview=1" : ""}`, { cache: "no-store" });
        const data = (await res.json()) as { active: boolean; endsAt?: number; seconds?: number; ads?: HouseAd[] };
        if (cancelled || !data.active || !data.ads?.length || (data.endsAt && Date.now() >= data.endsAt)) return;
        setAds(data.ads);
        setSeconds(data.seconds ?? 15);
        setOpen(true);
        try {
          sessionStorage.setItem("zv-works-popup", "1");
        } catch {
          // ignore
        }
      } catch {
        // offline or server busy: no pop-up
      }
    }, preview ? 800 : 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open || ads.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % ads.length), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [open, ads.length, seconds]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || ads.length === 0) return null;
  const ad = ads[index % ads.length];

  const cta = (
    <span className="inline-flex items-center justify-center rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-bold text-[#14110c] shadow">{ad.cta} →</span>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-end sm:justify-start sm:p-6" onClick={() => setOpen(false)}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/30 sm:bg-transparent" />
      <div
        role="dialog"
        aria-modal="false"
        aria-label="From ZIVARUKAH"
        onClick={(e) => e.stopPropagation()}
        className="popup-rise relative w-full max-w-sm overflow-hidden rounded-3xl bg-background shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg text-white backdrop-blur"
        >
          ✕
        </button>
        <div key={ad.key} className="popup-fade">
          <div className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br ${ad.theme}`}>
            {ad.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- image from our own storage
              <img
                src={ad.image.url}
                alt=""
                className={ad.image.fit === "cover" ? "h-full w-full object-cover" : "h-[88%] w-auto object-contain drop-shadow-2xl"}
              />
            ) : (
              <span aria-hidden="true" className="text-7xl drop-shadow-lg">{ad.emoji}</span>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-[#e3a82a] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#14110c]">
              From ZIVARUKAH
            </span>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">{ad.kicker}</p>
            <p className="mt-1 text-xl font-bold leading-snug">{ad.title}</p>
            {ad.text && <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/70">{ad.text}</p>}
            <div className="mt-4 flex items-center justify-between gap-3">
              {ad.external ? (
                <a href={ad.href} onClick={() => setOpen(false)}>
                  {cta}
                </a>
              ) : (
                <Link href={ad.href} onClick={() => setOpen(false)}>
                  {cta}
                </Link>
              )}
              {ads.length > 1 && (
                <span className="flex gap-1" aria-hidden="true">
                  {ads.map((a, i) => (
                    <span key={a.key} className={`h-1.5 rounded-full transition-all ${i === index % ads.length ? "w-5 bg-[#e3a82a]" : "w-1.5 bg-foreground/20"}`} />
                  ))}
                </span>
              )}
            </div>
          </div>
          {ads.length > 1 && (
            <span aria-hidden="true" className="block h-1 bg-black/5 dark:bg-white/10">
              <span key={`bar-${index}`} className="popup-progress block h-full bg-[#e3a82a]" style={{ animationDuration: `${seconds}s` }} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
