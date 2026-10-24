// Browser-only image helpers, shared by the admin uploaders and the public advert request form.

const MAX_EDGE = 2000; // px — default: plenty for full-width display, far smaller than phone photos
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** What the file picker offers: any photo (phones sometimes report odd or empty types). */
export const IMAGE_PICKER_ACCEPT = "image/*";

export interface Resized {
  blob: Blob;
  width: number;
  height: number;
}

/** A friendly reason a picked file can't be used, or null if it looks like a photo. */
export function imageProblem(file: File): string | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.includes("heic") || type.includes("heif") || /\.(heic|heif)$/.test(name)) {
    return "This photo is in HEIC format, which browsers can't open. On Samsung: Camera → Settings → turn off \"High efficiency pictures\", or take a screenshot of the photo and upload that.";
  }
  if (type && !type.startsWith("image/")) return "That file isn't a photo. Choose a JPEG, PNG or WebP image.";
  return null;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; done: () => void }> {
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, done: () => bitmap.close() };
  } catch {
    // Older phones: fall back to an <img> element.
    const url = URL.createObjectURL(file);
    const img = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("This photo couldn't be opened. Try another one, or a screenshot of it."));
        img.src = url;
      });
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, done: () => URL.revokeObjectURL(url) };
  }
}

/** Shrinks large photos and re-encodes them, which also strips camera
 *  metadata such as GPS location before anything leaves the device. */
export async function resize(file: File, maxEdge = MAX_EDGE, quality = 0.85): Promise<Resized> {
  const problem = imageProblem(file);
  if (problem) throw new Error(problem);
  const image = await decode(file);
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser couldn't process the image.");
  context.drawImage(image.source, 0, 0, width, height);
  image.done();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("This browser couldn't process the image.");
  return { blob, width, height };
}
