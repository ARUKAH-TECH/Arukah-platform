"use client";

import { useEffect, useState } from "react";

export interface RotatingAd {
  id: string;
  label: string;
  imageUrl: string;
  linkUrl: string | null;
  seconds: number;
}

/**
 * The top advert strip. Sticky just below the 61px site header, so it stays
 * on screen while the page scrolls. The whole image is shown (shrunk to fit,
 * never cropped) over a blurred copy of itself. With two or more adverts it
 * moves to the next one after that advert's own number of seconds.
 */
export function AdRotator({ ads }: { ads: RotatingAd[] }) {
  const [index, setIndex] = useState(0);
  const current = ads[index % ads.length];

  useEffect(() => {
    if (ads.length < 2) return;
    const timer = window.setTimeout(
      () => setIndex((value) => (value + 1) % ads.length),
      Math.max(3, current.seconds) * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [index, ads.length, current.seconds]);

  return (
    <aside aria-label="Sponsored" className="sticky top-[61px] z-30 border-b border-black/10 bg-background/95 backdrop-blur dark:border-white/10">
      <div className="mx-auto w-full max-w-6xl px-2 py-1.5 sm:px-6 lg:px-8">
        <div className="relative aspect-[8/1] w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
          {ads.map((ad, i) => {
            const visible = i === index % ads.length;
            const picture = (
              <>
                {/* Blurred fill so a flyer that isn't 8:1 still looks intentional. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative background copy */}
                <img src={ad.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-md" />
                {/* eslint-disable-next-line @next/next/no-img-element -- advert image from our media bucket */}
                <img src={ad.imageUrl} alt={`Sponsored: ${ad.label}`} className="relative h-full w-full object-contain" />
              </>
            );
            const layer = `absolute inset-0 block transition-opacity duration-700 motion-reduce:transition-none ${
              visible ? "opacity-100" : "pointer-events-none opacity-0"
            }`;
            return ad.linkUrl ? (
              <a
                key={ad.id}
                href={ad.linkUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className={layer}
                aria-hidden={!visible}
                tabIndex={visible ? 0 : -1}
              >
                {picture}
              </a>
            ) : (
              <div key={ad.id} className={layer} aria-hidden={!visible}>
                {picture}
              </div>
            );
          })}
          <span className="pointer-events-none absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
            Sponsored
          </span>
          {ads.length > 1 && (
            <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
              {ads.map((ad, i) => (
                <span key={ad.id} className={`h-1 w-1 rounded-full ${i === index % ads.length ? "bg-white" : "bg-white/50"}`} />
              ))}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
