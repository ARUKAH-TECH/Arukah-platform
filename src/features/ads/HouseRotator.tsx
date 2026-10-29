"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HouseAd } from "./houseAds";
import { resized } from "@/lib/resizedImage";

// The top advert strip while no paid advert is running: our own works take
// turns every 15 seconds. One slide always invites businesses to advertise.

function Slide({ ad }: { ad: HouseAd | null }) {
  if (!ad) {
    return (
      <span className="flex h-full w-full items-center justify-center gap-3 bg-gradient-to-r from-[#001a4d] via-[#002f80] to-[#001a4d] px-3 text-white">
        <span aria-hidden="true" className="text-lg sm:text-2xl">📣</span>
        <span className="text-sm font-bold text-[#f0c050] sm:text-lg">Your advert here</span>
        <span className="hidden text-sm text-white/85 sm:inline">Reach visitors across ZIVARUKAH</span>
        <span className="rounded-full bg-[#e3a82a] px-3 py-1 text-[11px] font-semibold text-[#14110c] sm:text-sm">Advertise →</span>
      </span>
    );
  }
  return (
    <span className={`flex h-full w-full items-center gap-2 bg-gradient-to-r ${ad.theme} px-2 text-white sm:gap-4 sm:px-4`}>
      <span className="relative flex aspect-square h-[82%] shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/15">
        {ad.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- small thumbnail from our own storage
          <img src={resized(ad.image.url, 128)} alt="" className={`h-full w-full ${ad.image.fit === "cover" ? "object-cover" : "object-contain"}`} />
        ) : (
          <span aria-hidden="true" className="text-base sm:text-2xl">{ad.emoji}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#f0c050] sm:text-xs">{ad.kicker}</span>
        <span className="truncate text-xs font-bold sm:text-lg">{ad.title}</span>
      </span>
      <span className="shrink-0 rounded-full bg-[#e3a82a] px-2.5 py-1 text-[11px] font-semibold text-[#14110c] sm:px-4 sm:text-sm">{ad.cta} →</span>
    </span>
  );
}

export function HouseRotator({ ads, seconds }: { ads: HouseAd[]; seconds: number }) {
  // The last slot is the "Your advert here" invitation.
  const slides: (HouseAd | null)[] = [...ads, null];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [slides.length, seconds]);

  return (
    <aside aria-label="From ZIVARUKAH" className="sticky top-[61px] z-30 border-b border-black/10 bg-background/95 backdrop-blur dark:border-white/10">
      <div className="mx-auto w-full max-w-6xl px-2 py-1.5 sm:px-6 lg:px-8">
        <div className="relative aspect-[8/1] min-h-[44px] w-full overflow-hidden rounded-lg">
          {slides.map((ad, i) => {
            const visible = i === index;
            const cls = `absolute inset-0 block transition-opacity duration-700 motion-reduce:transition-none ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`;
            const key = ad?.key ?? "advertise";
            if (!ad) {
              return (
                <Link key={key} href="/advertise" className={cls} tabIndex={visible ? 0 : -1} aria-hidden={!visible}>
                  <Slide ad={null} />
                </Link>
              );
            }
            return ad.external ? (
              <a key={key} href={ad.href} className={cls} tabIndex={visible ? 0 : -1} aria-hidden={!visible}>
                <Slide ad={ad} />
              </a>
            ) : (
              <Link key={key} href={ad.href} className={cls} tabIndex={visible ? 0 : -1} aria-hidden={!visible}>
                <Slide ad={ad} />
              </Link>
            );
          })}
          <span aria-hidden="true" className="ad-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </div>
    </aside>
  );
}
