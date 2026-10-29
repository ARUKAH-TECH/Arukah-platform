// A smaller copy of an image through the site's image service (WebP, sized
// for where it is shown) instead of downloading the full original.
// Works for our own /public files and the Supabase media bucket.
const WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];

export function resized(url: string, width: number, quality = 75) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const w = WIDTHS.find((x) => x >= width) ?? 1920;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=${quality}`;
}
