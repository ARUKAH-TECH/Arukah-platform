import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";

// Public programme data. Row Level Security hides drafts; joining links live
// in an admin-only table and are never read here.

export interface PublicProgramme {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  image: { url: string; width: number | null; height: number | null } | null;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  scheduleNote: string;
  regOpensAt: string | null;
  regClosesAt: string | null;
  capacity: number | null;
  taken: number;
  priceGhs: number;
  approval: "auto" | "manual";
  status: "published" | "closed" | "completed" | "cancelled";
  platform: string;
  platformName: string;
  linkRelease: string;
}

const COLUMNS =
  "id, slug, title, summary, description, category, image_path, image_width, image_height, starts_at, ends_at, time_zone, schedule_note, reg_opens_at, reg_closes_at, capacity, price_ghs, approval, status, platform, platform_name, link_release";

interface Row {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  schedule_note: string;
  reg_opens_at: string | null;
  reg_closes_at: string | null;
  capacity: number | null;
  price_ghs: number | string;
  approval: string;
  status: string;
  platform: string;
  platform_name: string;
  link_release?: string;
}

function toProgramme(r: Row, taken: number): PublicProgramme {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    description: r.description,
    category: r.category,
    image: r.image_path ? { url: mediaPublicUrl(r.image_path), width: r.image_width, height: r.image_height } : null,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    timeZone: r.time_zone,
    scheduleNote: r.schedule_note,
    regOpensAt: r.reg_opens_at,
    regClosesAt: r.reg_closes_at,
    capacity: r.capacity,
    taken,
    priceGhs: Number(r.price_ghs),
    approval: r.approval === "manual" ? "manual" : "auto",
    status: r.status as PublicProgramme["status"],
    platform: r.platform,
    platformName: r.platform_name,
    linkRelease: r.link_release ?? "always",
  };
}

async function places(client: ReturnType<typeof createPublicClient>) {
  const { data } = await client.rpc("programme_places");
  return new Map(((data ?? []) as { programme_id: string; taken: number }[]).map((p) => [p.programme_id, p.taken]));
}

/** Programmes to show on /programmes: upcoming and running first, then the 20 most recent past ones. */
export async function getPublicProgrammes(): Promise<PublicProgramme[]> {
  let client;
  try {
    client = createPublicClient();
  } catch {
    return [];
  }
  const [{ data, error }, taken] = await Promise.all([client.from("programmes").select(COLUMNS).neq("status", "draft").order("starts_at").limit(200), places(client)]);
  if (error) {
    console.error("[programmes] list failed", error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map((r) => toProgramme(r, taken.get(r.id) ?? 0));
}

export async function getPublicProgramme(slug: string): Promise<PublicProgramme | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  let client;
  try {
    client = createPublicClient();
  } catch {
    return null;
  }
  const [{ data }, taken] = await Promise.all([client.from("programmes").select(COLUMNS).eq("slug", slug).neq("status", "draft").maybeSingle(), places(client)]);
  return data ? toProgramme(data as Row, taken.get((data as Row).id) ?? 0) : null;
}

/** Whether people can register right now, and if not, why. */
export function registrationState(p: PublicProgramme, now = Date.now()): { open: boolean; label: string } {
  if (p.status === "cancelled") return { open: false, label: "Cancelled" };
  if (p.status === "completed") return { open: false, label: "Completed" };
  if (p.status === "closed") return { open: false, label: "Registration closed" };
  if (p.regOpensAt && now < Date.parse(p.regOpensAt)) return { open: false, label: "Registration opens soon" };
  if (now >= Date.parse(p.regClosesAt ?? p.endsAt)) return { open: false, label: "Registration closed" };
  if (p.capacity != null && p.taken >= p.capacity) return { open: false, label: "Full" };
  return { open: true, label: "Registration open" };
}
