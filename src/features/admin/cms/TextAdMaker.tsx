"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

// Makes a designed text banner (1200 × 150, the exact strip shape) from the
// advert request's own words, for adverts that came without a photo or video.

const W = 1200;
const H = 150;

export const TEXT_AD_THEMES = {
  royal: { label: "Royal blue & gold", bg: ["#001a4d", "#002f80"], title: "#f0c050", text: "#ffffff", pill: "#e3a82a", pillText: "#14110c" },
  night: { label: "Black & gold", bg: ["#0b0b0b", "#262117"], title: "#e3a82a", text: "#f3f3f3", pill: "#e3a82a", pillText: "#14110c" },
  fresh: { label: "Green & white", bg: ["#064e3b", "#0f766e"], title: "#ffffff", text: "#d1fae5", pill: "#facc15", pillText: "#1c1917" },
  bold: { label: "Red & white", bg: ["#7f1d1d", "#b91c1c"], title: "#ffffff", text: "#fee2e2", pill: "#ffffff", pillText: "#7f1d1d" },
  light: { label: "White & blue", bg: ["#ffffff", "#e8eefb"], title: "#002f80", text: "#1f2937", pill: "#002f80", pillText: "#ffffff" },
} as const;
type ThemeId = keyof typeof TEXT_AD_THEMES;

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Largest font size (down to min) that fits in maxWidth; returns size. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: string, size: number, min: number, maxWidth: number) {
  let s = size;
  for (; s > min; s -= 2) {
    ctx.font = `${weight} ${s}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) return s;
  }
  ctx.font = `${weight} ${min}px ${FONT}`;
  return min;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function draw(canvas: HTMLCanvasElement, headline: string, line2: string, contact: string, theme: ThemeId) {
  const t = TEXT_AD_THEMES[theme];
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(1, t.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Soft diagonal light band.
  const shine = ctx.createLinearGradient(0, 0, W, 0);
  shine.addColorStop(0.55, "rgba(255,255,255,0)");
  shine.addColorStop(0.7, "rgba(255,255,255,0.08)");
  shine.addColorStop(0.85, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, W, H);
  // Accent bar.
  ctx.fillStyle = t.pill;
  ctx.fillRect(0, 0, 12, H);

  // Contact pill on the right.
  let right = W - 30;
  if (contact.trim()) {
    const size = fit(ctx, contact, "700", 34, 22, 330);
    ctx.font = `700 ${size}px ${FONT}`;
    const label = ellipsize(ctx, contact, 330);
    const pw = ctx.measureText(label).width + 56;
    const ph = size + 30;
    const px = W - 30 - pw;
    const py = (H - ph) / 2;
    ctx.fillStyle = t.pill;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = t.pillText;
    ctx.textBaseline = "middle";
    ctx.fillText(label, px + 28, H / 2 + 1);
    right = px - 30;
  }

  // Headline + second line on the left.
  const left = 44;
  const maxW = right - left;
  ctx.textBaseline = "alphabetic";
  const hs = fit(ctx, headline, "800", 60, 34, maxW);
  ctx.font = `800 ${hs}px ${FONT}`;
  ctx.fillStyle = t.title;
  const hasLine2 = Boolean(line2.trim());
  ctx.fillText(ellipsize(ctx, headline, maxW), left, hasLine2 ? 72 : 75 + hs / 3);
  if (hasLine2) {
    ctx.font = `500 32px ${FONT}`;
    ctx.fillStyle = t.text;
    ctx.fillText(ellipsize(ctx, line2, maxW), left, 118);
  }
}

export function TextAdMaker({
  defaults,
  fullyPaid,
  onReady,
}: {
  defaults: { headline: string; line2: string; contact: string };
  fullyPaid: boolean;
  onReady: (image: { path: string; width: number; height: number }) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [headline, setHeadline] = useState(defaults.headline);
  const [line2, setLine2] = useState(defaults.line2);
  const [contact, setContact] = useState(defaults.contact);
  const [theme, setTheme] = useState<ThemeId>("royal");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (canvas.current) draw(canvas.current, headline, line2, contact, theme);
  }, [headline, line2, contact, theme]);

  async function use() {
    if (!canvas.current || !headline.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.current!.toBlob(resolve, "image/webp", 0.92));
      if (!blob) throw new Error("This browser couldn't make the image.");
      const path = `ads/${crypto.randomUUID()}.webp`;
      const { error } = await createClient().storage.from("media").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      onReady({ path, width: W, height: H });
      setMessage({ ok: true, text: "Text advert ready ✓ — now press Save." });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Couldn't make the advert." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-black/20 p-3 dark:border-white/20">
      <p className="text-xs font-semibold">✍️ No photo or video? Make a designed text advert</p>
      {!fullyPaid && (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Available once the advert is <strong>Full paid</strong> (choose it under Payment above).
        </p>
      )}
      <canvas ref={canvas} aria-label="Preview of the text advert" className="aspect-[8/1] w-full rounded-lg shadow" />
      <label className="text-xs font-medium">
        Big words (business or offer)
        <input value={headline} maxLength={60} onChange={(e) => setHeadline(e.target.value)} className={fieldClasses} />
      </label>
      <label className="text-xs font-medium">
        Second line <span className="font-normal text-foreground/50">(optional)</span>
        <input value={line2} maxLength={90} onChange={(e) => setLine2(e.target.value)} className={fieldClasses} />
      </label>
      <label className="text-xs font-medium">
        Contact button <span className="font-normal text-foreground/50">(phone, place or offer — optional)</span>
        <input value={contact} maxLength={40} onChange={(e) => setContact(e.target.value)} className={fieldClasses} />
      </label>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TEXT_AD_THEMES) as ThemeId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={theme === id}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${theme === id ? "border-brand-primary-text font-semibold" : "border-black/10 dark:border-white/10"}`}
          >
            <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: `linear-gradient(90deg, ${TEXT_AD_THEMES[id].bg[1]}, ${TEXT_AD_THEMES[id].pill})` }} />
            {TEXT_AD_THEMES[id].label}
          </button>
        ))}
      </div>
      <div>
        <button type="button" onClick={use} disabled={busy || !fullyPaid || !headline.trim()} className={primaryButtonClasses}>
          {busy ? "Making…" : "Use this text advert"}
        </button>
      </div>
      {message && <p className={`text-xs ${message.ok ? "text-green-700 dark:text-green-400" : "font-medium text-red-700 dark:text-red-400"}`}>{message.text}</p>}
    </div>
  );
}
