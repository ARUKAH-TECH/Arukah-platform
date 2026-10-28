// Stamps a brand logo badge into the bottom-right corner of a photo, in the
// browser, before it is uploaded — so the logo stays on the picture even if
// someone saves it or shares it on WhatsApp.

export const LOGO_STAMPS: Record<string, { src: string; label: string }> = {
  wear: { src: "/branding/footwear/watermark.png", label: "ARUKAH WEAR logo" },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load the logo."));
    img.src = src;
  });
}

/** Returns a new WebP with the badge drawn on (about 18% of the shorter side). */
export async function stampLogo(photo: Blob, width: number, height: number, logoSrc: string, quality = 0.82): Promise<Blob> {
  const [logo, picture] = await Promise.all([loadImage(logoSrc), createImageBitmap(photo)]);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This phone couldn't add the logo.");
  ctx.drawImage(picture, 0, 0, width, height);
  const size = Math.round(Math.max(72, Math.min(width, height) * 0.18));
  const margin = Math.round(size * 0.12);
  ctx.drawImage(logo, width - size - margin, height - size - margin, size, size);
  picture.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't add the logo."))), "image/webp", quality),
  );
}
