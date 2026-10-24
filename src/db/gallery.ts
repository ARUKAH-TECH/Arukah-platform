import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";

export interface GalleryPhoto {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  caption: string;
}

export async function getGallery(branch: string, limit = 24): Promise<GalleryPhoto[]> {
  let client;
  try {
    client = createPublicClient();
  } catch {
    return [];
  }
  const { data, error } = await client
    .from("gallery_photos")
    .select("id, storage_path, width, height, caption")
    .eq("branch", branch)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[gallery] list failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    url: mediaPublicUrl(row.storage_path),
    width: row.width,
    height: row.height,
    caption: row.caption,
  }));
}
