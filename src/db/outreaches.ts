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
}

const COLUMNS = "id, slug, title, outreach_type, purpose, body, outreach_date, location, needs";

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
  return (data as OutreachRow[]).map(toOutreach);
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
