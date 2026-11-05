import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

// Devotionals and Bible studies written by Repent Online Ministries.
// Row Level Security shows visitors only published items (a devotional only
// from its own day).

export interface Devotional {
  id: string;
  day: string; // YYYY-MM-DD
  title: string;
  verseRef: string;
  body: string;
  prayer: string;
}
export interface StudySeries {
  id: string;
  slug: string;
  title: string;
  summary: string;
  lessonCount: number;
}
export interface StudyLesson {
  id: string;
  position: number;
  title: string;
  scripture: string;
  body: string;
  quiz: string;
}

function client() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}

const DEVOTIONAL = "id, day, title, verse_ref, body, prayer";
type DevotionalRow = { id: string; day: string; title: string; verse_ref: string; body: string; prayer: string };
const toDevotional = (r: DevotionalRow): Devotional => ({ id: r.id, day: r.day, title: r.title, verseRef: r.verse_ref, body: r.body, prayer: r.prayer });

/** The newest devotional (today's, or the latest before it). */
export async function latestDevotional(): Promise<Devotional | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase.from("bible_devotionals").select(DEVOTIONAL).order("day", { ascending: false }).limit(1).maybeSingle();
  return data ? toDevotional(data as DevotionalRow) : null;
}

export async function listDevotionals(limit = 60): Promise<Devotional[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data } = await supabase.from("bible_devotionals").select(DEVOTIONAL).order("day", { ascending: false }).limit(limit);
  return ((data ?? []) as DevotionalRow[]).map(toDevotional);
}

export async function getDevotional(day: string): Promise<Devotional | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase.from("bible_devotionals").select(DEVOTIONAL).eq("day", day).maybeSingle();
  return data ? toDevotional(data as DevotionalRow) : null;
}

export async function listSeries(): Promise<StudySeries[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("bible_series")
    .select("id, slug, title, summary, bible_lessons(id)")
    .order("sort_order")
    .order("created_at");
  return (data ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    lessonCount: Array.isArray(s.bible_lessons) ? s.bible_lessons.length : 0,
  }));
}

export async function getSeries(slug: string): Promise<(StudySeries & { lessons: StudyLesson[] }) | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const supabase = client();
  if (!supabase) return null;
  const { data: s } = await supabase.from("bible_series").select("id, slug, title, summary").eq("slug", slug).maybeSingle();
  if (!s) return null;
  const { data: lessons } = await supabase
    .from("bible_lessons")
    .select("id, position, title, scripture, body, quiz")
    .eq("series_id", s.id)
    .order("position")
    .order("created_at");
  const list = (lessons ?? []) as StudyLesson[];
  return { ...s, lessonCount: list.length, lessons: list };
}
