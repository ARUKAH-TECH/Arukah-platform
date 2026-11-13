import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export interface PublicOutreach {
  id: string;
  slug: string;
  title: string;
  type: string;
  purpose: string;
  body: string;
  date: string | null;
  location: string;
  needs: string[];
  /** Fundraising goal in cedis, if set. */
  goal: number | null;
  /** First consent-cleared photo (our own /outreach-photo/ address), if any. */
  cover?: string | null;
}

interface OutreachRow {
  id: string;
  slug: string;
  title: string;
  outreach_type: string;
  purpose: string;
  body: string;
  outreach_date: string | null;
  location: string;
  needs: string[];
  goal_ghs: number | string | null;
}

const COLUMNS = "id, slug, title, outreach_type, purpose, body, outreach_date, location, needs, goal_ghs";

function toOutreach(row: OutreachRow): PublicOutreach {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.outreach_type,
    purpose: row.purpose,
    body: row.body,
    date: row.outreach_date,
    location: row.location,
    needs: row.needs,
    goal: row.goal_ghs === null || row.goal_ghs === undefined ? null : Number(row.goal_ghs),
  };
}

/** The anonymous client, or null when Supabase isn't configured (pages then show no outreaches). */
function safeClient() {
  try {
    return createPublicClient();
  } catch (error) {
    console.error("[outreaches] Supabase not configured", (error as Error).message);
    return null;
  }
}

/** Published outreaches, most recent first. RLS hides drafts, archived, future and expired ones. */
export async function getPublicOutreaches(limit = 24): Promise<PublicOutreach[]> {
  const client = safeClient();
  if (!client) return [];
  const { data, error } = await client
    .from("outreaches")
    .select(COLUMNS)
    .order("outreach_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[outreaches] public list failed", error.message);
    return [];
  }
  const list = (data as OutreachRow[]).map(toOutreach);
  return withCovers(client, list);
}

/** Adds each outreach's first photo. RLS only returns cleared photos of public outreaches. */
async function withCovers(client: NonNullable<ReturnType<typeof safeClient>>, list: PublicOutreach[]) {
  if (!list.length) return list;
  const { data } = await client
    .from("outreach_media")
    .select("id, outreach_id")
    .eq("kind", "image")
    .in(
      "outreach_id",
      list.map((o) => o.id),
    )
    .order("created_at");
  const first = new Map<string, string>();
  for (const row of (data ?? []) as { id: string; outreach_id: string }[]) {
    if (!first.has(row.outreach_id)) first.set(row.outreach_id, `/outreach-photo/${row.id}`);
  }
  return list.map((o) => ({ ...o, cover: first.get(o.id) ?? null }));
}

export async function getPublicOutreach(slug: string): Promise<PublicOutreach | null> {
  const client = safeClient();
  if (!client) return null;
  const { data, error } = await client.from("outreaches").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[outreaches] public detail failed", error.message);
    return null;
  }
  return data ? toOutreach(data as OutreachRow) : null;
}

export interface PublicOutreachMedia {
  id: string;
  kind: "image" | "video_link";
  /** Our own consent-checked address for images; the YouTube/TikTok link for videos. */
  url: string;
  altText: string;
  caption: string;
  width: number | null;
  height: number | null;
}

/**
 * Media for one outreach that visitors may see. Row Level Security returns
 * only items whose outreach is published and whose consent is cleared.
 */
export async function getPublicOutreachMedia(outreachId: string): Promise<PublicOutreachMedia[]> {
  const client = safeClient();
  if (!client) return [];
  const { data, error } = await client
    .from("outreach_media")
    .select("id, kind, video_url, alt_text, caption, width, height")
    .eq("outreach_id", outreachId)
    .order("created_at");
  if (error) {
    console.error("[outreaches] public media failed", error.message);
    return [];
  }
  return (
    data as {
      id: string;
      kind: "image" | "video_link";
      video_url: string | null;
      alt_text: string;
      caption: string;
      width: number | null;
      height: number | null;
    }[]
  ).map((row) => ({
    id: row.id,
    kind: row.kind,
    url: row.kind === "image" ? `/outreach-photo/${row.id}` : (row.video_url ?? ""),
    altText: row.alt_text,
    caption: row.caption,
    width: row.width,
    height: row.height,
  }));
}

/** Total given so far (confirmed by Paystack) towards a public outreach. */
export async function getOutreachRaised(outreachId: string): Promise<number> {
  const client = safeClient();
  if (!client) return 0;
  const { data, error } = await client.rpc("outreach_raised", { p_outreach: outreachId });
  if (error) return 0;
  return Number(data ?? 0);
}
