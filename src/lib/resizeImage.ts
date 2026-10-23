// Browser-only image helpers, shared by the admin uploaders and the public advert request form.

const MAX_EDGE = 2000; // px — plenty for full-width display, far smaller than phone photos
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface Resized {
  blob: Blob;
  width: number;
  height: number;
}

/** Shrinks large photos and re-encodes them, which also strips camera
 *  metadata such as GPS location before anything leaves the device. */
export async function resize(file: File): Promise<Resized> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("This browser couldn't process the image.");
  return { blob, width, height };
}
