import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { BranchId } from "@/config/branches";

export type AnnouncementTone = "info" | "highlight" | "urgent";

export interface PublicAnnouncement {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string;
  tone: AnnouncementTone;
}

interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  link_label: string;
  tone: AnnouncementTone;
}

/**
 * Live announcements for one page, newest first. Row Level Security hides
 * drafts, archived, not-yet-scheduled and expired ones from this anonymous
 * client. Any failure (database down, settings missing) means "show none" —
 * a banner must never take a public page down.
 */
export async function getPublicAnnouncements(branch: BranchId, limit = 3): Promise<PublicAnnouncement[]> {
  let client;
  try {
    client = createPublicClient();
  } catch (error) {
    console.error("[announcements] Supabase not configured", (error as Error).message);
    return [];
  }

  const { data, error } = await client
    .from("announcements")
    .select("id, title, message, link_url, link_label, tone")
    .contains("branches", [branch])
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[announcements] public list failed", error.message);
    return [];
  }

  return (data as AnnouncementRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    linkUrl: row.link_url,
    linkLabel: row.link_label,
    tone: row.tone,
  }));
}
