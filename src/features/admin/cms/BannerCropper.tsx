"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { secondaryButtonClasses, primaryButtonClasses } from "@/features/admin/ui";

const OUT_W = 1200;
const OUT_H = 150; // the banner's 8:1 shape

export interface CropSource {
  label: string;
  url: string;
}

/**
 * Crop any advert picture to exactly the banner shape: zoom and move with
 * sliders, watch the live preview, then save a 1200 × 150 image to the
 * media library. Works on phones (no dragging needed).
 */
export function BannerCropper({
  sources,
  onCropped,
}: {
  sources: CropSource[];
  onCropped: (image: { path: string; width: number; height: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(sources[0]?.url ?? "");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Load the chosen picture (cross-origin so the crop can be saved).
  useEffect(() => {
    if (!open || !sourceUrl) return;
    setImage(null);
    setError("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setError("Couldn't load this picture for cropping.");
    img.src = sourceUrl;
  }, [open, sourceUrl]);

  // Redraw the preview whenever the picture or a slider changes.
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !image) return;
    const W = image.naturalWidth;
    const H = image.naturalHeight;
    const aspect = OUT_W / OUT_H;
    // Largest 8:1 area that fits, then zoom in.
    let cw = W / H > aspect ? H * aspect : W;
    let ch = cw / aspect;
    cw /= zoom;
    ch /= zoom;
    const sx = (W - cw) * (x / 100);
    const sy = (H - ch) * (y / 100);
    ctx.clearRect(0, 0, OUT_W, OUT_H);
    ctx.drawImage(image, sx, sy, cw, ch, 0, 0, OUT_W, OUT_H);
  }, [image, zoom, x, y]);

  async function save() {
    if (!canvas.current) return;
    setSaving(true);
    setError("");
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.current!.toBlob(resolve, "image/webp", 0.88));
      if (!blob) throw new Error("Couldn't create the cropped image.");
      const path = `ads/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await createClient()
        .storage.from("media")
        .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (uploadError) throw new Error(uploadError.message);
      onCropped({ path, width: OUT_W, height: OUT_H });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saving the crop failed.");
    } finally {
      setSaving(false);
    }
  }

  if (sources.length === 0) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={secondaryButtonClasses}>
        Crop to banner shape…
      </button>
    );
  }

  const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, step: number) => (
    <label className="flex flex-col gap-1 text-xs">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-primary-text p-4">
      <p className="text-sm font-medium">Crop to the banner shape</p>
      {sources.length > 1 && (
        <label className="text-xs">
          Picture
          <select value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="mt-1 block w-full rounded border border-black/15 bg-transparent p-1 text-sm dark:border-white/15">
            {sources.map((source) => (
              <option key={source.url} value={source.url}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <canvas
        ref={canvas}
        width={OUT_W}
        height={OUT_H}
        className="aspect-[8/1] w-full rounded-lg bg-black/10 dark:bg-white/10"
        aria-label="Preview of the cropped banner"
      />
      {!image && !error && <p className="text-xs text-foreground/60">Loading picture…</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {slider("Zoom", zoom, setZoom, 1, 4, 0.05)}
        {slider("Up / down", y, setY, 0, 100, 1)}
        {slider("Left / right", x, setX, 0, 100, 1)}
      </div>
      {error && <p className="text-xs text-red-700 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={save} disabled={!image || saving} className={primaryButtonClasses}>
          {saving ? "Saving…" : "Use this crop"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
