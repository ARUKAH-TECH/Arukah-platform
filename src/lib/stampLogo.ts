// Stamps a brand logo badge (top-right) and a contact label (bottom-left:
// phone number and website) into a photo, in the browser, before it is
// uploaded — so they stay on the picture even if someone saves it or shares
// it on WhatsApp.

import { PHONE_DISPLAY } from "@/config/forms";

export const LOGO_STAMPS: Record<string, { src: string; label: string; lines: string[] }> = {
  wear: {
    src: "/branding/footwear/watermark.png",
    label: "ARUKAH WEAR logo, phone number and website",
    lines: [`Call / WhatsApp ${PHONE_DISPLAY}`, "zivarukah.com/footwear"],
  },
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A rounded leather-brown label with white text, bottom-left. */
function drawContact(ctx: CanvasRenderingContext2D, lines: string[], left: number, bottom: number, maxWidth: number, badge: number) {
  if (lines.length === 0 || maxWidth < 60) return;
  let font = Math.max(12, Math.round(badge * 0.15));
  const family = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const measure = () => {
    ctx.font = `700 ${font}px ${family}`;
    return Math.max(...lines.map((l) => ctx.measureText(l).width));
  };
  const padX = () => Math.round(font * 0.8);
  while (font > 9 && measure() + padX() * 2 > maxWidth) font -= 1;
  const textW = measure();
  const lineH = Math.round(font * 1.3);
  const h = lineH * lines.length + Math.round(font * 0.7);
  const w = Math.round(textW + padX() * 2);
  const y = bottom - h;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = Math.round(font * 0.6);
  ctx.shadowOffsetY = Math.round(font * 0.15);
  ctx.fillStyle = "rgba(90, 45, 12, 0.9)";
  roundRect(ctx, left, y, w, h, Math.round(font * 0.6));
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    ctx.font = `${i === 0 ? 700 : 600} ${font}px ${family}`;
    ctx.fillStyle = i === 0 ? "#ffffff" : "#f6d38a";
    ctx.fillText(line, left + padX(), y + Math.round(font * 0.35) + lineH * i + lineH / 2);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load the logo."));
    img.src = src;
  });
}

/** Returns a new WebP with the badge drawn on (about 18% of the shorter side). */
export async function stampLogo(photo: Blob, width: number, height: number, logoSrc: string, lines: string[] = [], quality = 0.82): Promise<Blob> {
  const [logo, picture] = await Promise.all([loadImage(logoSrc), createImageBitmap(photo)]);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This phone couldn't add the logo.");
  ctx.drawImage(picture, 0, 0, width, height);
  const size = Math.round(Math.max(72, Math.min(width, height) * 0.18));
  const margin = Math.round(size * 0.12);
  ctx.drawImage(logo, width - size - margin, margin, size, size); // top-right
  drawContact(ctx, lines, margin, height - margin, width - margin * 2, size); // bottom-left
  picture.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't add the logo."))), "image/webp", quality),
  );
}
