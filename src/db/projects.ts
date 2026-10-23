import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";
import type { BranchId } from "@/config/branches";

export interface PublicMedia {
  id: string;
  kind: "image" | "video_link";
  url: string;
  altText: string;
  caption: string;
  width: number | null;
  height: number | null;
}

export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  branches: string[];
  publishAt: string | null;
  cover: PublicMedia | null;
  media: PublicMedia[];
}

interface MediaRow {
  id: string;
  kind: "image" | "video_link";
  storage_path: string | null;
  video_url: string | null;
  alt_text: string;
  caption: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  branches: string[];
  publish_at: string | null;
  cover_media_id: string | null;
  media_items: MediaRow[];
}

const PROJECT_COLUMNS =
  "id, slug, title, summary, body, branches, publish_at, cover_media_id, media_items!media_items_project_id_fkey(id, kind, storage_path, video_url, alt_text, caption, width, height, created_at)";

function toMedia(row: MediaRow): PublicMedia {
  return {
    id: row.id,
    kind: row.kind,
    url: row.kind === "image" ? mediaPublicUrl(row.storage_path!) : row.video_url!,
    altText: row.alt_text,
    caption: row.caption,
    width: row.width,
    height: row.height,
  };
}

function toProject(row: ProjectRow): PublicProject {
  const media = [...row.media_items]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(toMedia);
  const cover =
    media.find((item) => item.id === row.cover_media_id) ??
    media.find((item) => item.kind === "image") ??
    null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    branches: row.branches,
    publishAt: row.publish_at,
    cover,
    media,
  };
}

/**
 * The anonymous client, or null when the Supabase settings are missing
 * (e.g. a preview deployment without them). Public pages then simply show
 * no projects instead of failing to build or render.
 */
function safePublicClient() {
  try {
    return createPublicClient();
  } catch (error) {
    console.error("[projects] Supabase not configured", (error as Error).message);
    return null;
  }
}

/**
 * Published projects, newest first. Row Level Security already hides drafts,
 * archived, not-yet-scheduled and expired projects from this anonymous
 * client; the query doesn't need to (and shouldn't) re-implement that.
 */
export async function getPublicProjects(branch?: BranchId, limit = 24): Promise<PublicProject[]> {
  const client = safePublicClient();
  if (!client) return [];
  let query = client
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (branch) query = query.contains("branches", [branch]);

  const { data, error } = await query;
  if (error) {
    // A database hiccup must not take the public page down — show no
    // projects rather than an error page, and leave a trace in the logs.
    console.error("[projects] public list failed", error.message);
    return [];
  }
  return (data as unknown as ProjectRow[]).map(toProject);
}

export async function getPublicProject(slug: string): Promise<PublicProject | null> {
  const client = safePublicClient();
  if (!client) return null;
  const { data, error } = await client
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[projects] public detail failed", error.message);
    return null;
  }
  return data ? toProject(data as unknown as ProjectRow) : null;
}
