import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

// The founder's quotes and photos (Admin → Bible app → My quotes & photos).

export interface FounderQuote {
  id: string;
  text: string;
}

const photoUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;

export async function listFounderQuotes(): Promise<FounderQuote[]> {
  try {
    const { data } = await createPublicClient().from("founder_quotes").select("id, text").eq("status", "published").order("created_at");
    return (data ?? []) as FounderQuote[];
  } catch {
    return [];
  }
}

export async function getFounderQuote(id: string): Promise<FounderQuote | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    const { data } = await createPublicClient().from("founder_quotes").select("id, text").eq("id", id).eq("status", "published").maybeSingle();
    return (data as FounderQuote) ?? null;
  } catch {
    return null;
  }
}

/** Photo addresses (uploaded ones). Empty → the main founder photo is used. */
export async function listFounderPhotos(): Promise<string[]> {
  try {
    const { data } = await createPublicClient().from("founder_photos").select("storage_path").eq("hidden", false).order("created_at");
    return (data ?? []).map((r) => photoUrl(r.storage_path as string));
  } catch {
    return [];
  }
}
