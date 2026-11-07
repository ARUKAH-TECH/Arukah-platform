import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { parseReference, refLabel } from "@/lib/bible";
import { askJson, cleanText } from "@/server/ai";
import { getPassage, todayInGhana } from "@/server/bible";

// The automatic daily devotional and topic research for the Bible app.
// Every Bible reference the AI suggests is checked against the real KJV text;
// references that don't exist are dropped.

export interface Themes {
  year: { theme: string; scripture: string } | null;
  month: { theme: string; scripture: string } | null;
}

export async function themesFor(day: string, client = createServiceClient()): Promise<Themes> {
  const year = day.slice(0, 4);
  const month = day.slice(0, 7);
  const { data } = await client.from("bible_themes").select("period, theme, scripture").in("period", [year, month]);
  const find = (p: string) => {
    const row = (data ?? []).find((r) => r.period === p);
    return row ? { theme: row.theme as string, scripture: row.scripture as string } : null;
  };
  return { year: find(year), month: find(month) };
}

async function validRefs(list: unknown, max: number): Promise<string[]> {
  const out: string[] = [];
  for (const item of Array.isArray(list) ? list : []) {
    if (typeof item !== "string") continue;
    const ref = parseReference(item);
    if (!ref) continue;
    const passage = await getPassage(item);
    if (!passage || !passage.verses.length) continue;
    const label = refLabel(ref);
    if (!out.includes(label)) out.push(label);
    if (out.length >= max) break;
  }
  return out;
}

export interface DevotionalDraft {
  title: string;
  verseRef: string;
  body: string;
  prayer: string;
}

/** Writes a devotional for the day on the year's and month's themes. */
export async function writeDevotional(day: string, themes: Themes, avoid: string[] = []): Promise<DevotionalDraft | null> {
  const date = new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const system = `You write short daily devotionals for Repent Online Ministries, a Bible-believing Christian ministry in Ghana (motto: "Rescue the Perishing").
Write warm, clear, practical devotionals that are faithful to Scripture, for ordinary readers on a phone. Use the King James Version for any quotation.
Return ONLY a JSON object: {"title": "...", "verses": ["Book C:V" or "Book C:V-V", ...], "body": "...", "prayer": "..."}
- title: 2 to 7 words.
- verses: 1 or 2 key references the devotional is built on (real KJV references only).
- body: 220 to 380 words in simple English. Plain paragraphs separated by a blank line; you may use one "## " sub-heading and "**bold**". No links, no emojis, no phone numbers. End with one short practical application for today.
- prayer: 2 to 4 sentences, ending with "In Jesus' name, Amen."
Do not mention that you are an AI. Do not invent quotes or stories about real people.`;
  const lines = [
    `Date: ${date}.`,
    themes.year ? `Theme of the year: "${themes.year.theme}"${themes.year.scripture ? ` (${themes.year.scripture})` : ""}.` : "",
    themes.month ? `Theme of the month: "${themes.month.theme}"${themes.month.scripture ? ` (${themes.month.scripture})` : ""}.` : "",
    !themes.year && !themes.month ? "No theme is set: choose an encouraging, Christ-centred subject." : "Build today's devotional on the month's theme, in the light of the year's theme. Take a fresh angle each day.",
    avoid.length ? `Recent devotional titles (do not repeat them): ${avoid.slice(0, 14).join("; ")}.` : "",
  ].filter(Boolean);
  const out = await askJson(system, lines.join("\n"));
  if (!out) return null;
  const title = cleanText(out.title, 120);
  const body = cleanText(out.body, 6000);
  const prayer = cleanText(out.prayer, 1200);
  const verses = await validRefs(out.verses, 2);
  if (title.length < 2 || body.length < 200) return null;
  return { title, verseRef: verses.join("; "), body, prayer };
}

/** Today's automatic devotional, if none was published. Safe to call many times. */
export async function runDailyDevotional(now = new Date()): Promise<{ status: string; id?: string }> {
  const day = todayInGhana();
  // The owner publishes by 5:00am; from 5:30am (Ghana = UTC) the system writes one if there is none.
  if (now.getUTCHours() * 60 + now.getUTCMinutes() < 5 * 60 + 25) return { status: "too-early" };
  const client = createServiceClient();
  const { data: setting } = await client.from("bible_settings").select("value").eq("key", "auto_devotional").maybeSingle();
  const mode = setting?.value ?? "publish";
  if (mode === "off") return { status: "off" };
  const { data: existing } = await client.from("bible_devotionals").select("id, status").eq("day", day).maybeSingle();
  if (existing) return { status: existing.status === "published" ? "already-published" : "draft-exists" };

  const { data: recent } = await client.from("bible_devotionals").select("title").order("day", { ascending: false }).limit(14);
  const draft = await writeDevotional(day, await themesFor(day, client), (recent ?? []).map((r) => r.title as string));
  if (!draft) return { status: "ai-failed" };
  const { data, error } = await client
    .from("bible_devotionals")
    .insert({ day, title: draft.title, verse_ref: draft.verseRef, body: draft.body, prayer: draft.prayer, status: mode === "draft" ? "draft" : "published", auto: true })
    .select("id")
    .single();
  if (error) return { status: error.code === "23505" ? "already-exists" : "save-failed" };
  return { status: mode === "draft" ? "saved-draft" : "published", id: data.id };
}

export interface TopicStudy {
  topic: string;
  meaning: string;
  words: { word: string; language: string; sense: string }[];
  points: string[];
  scriptures: { ref: string; note: string }[];
}

const TOPIC = /^[a-z][a-z '-]{1,59}$/;
export const cleanTopic = (q: string) => q.toLowerCase().replace(/[^a-z '-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

/** Meaning and supporting scriptures for a topic, cached so each topic is researched once. */
export async function topicStudy(raw: string): Promise<TopicStudy | null> {
  const topic = cleanTopic(raw);
  if (!TOPIC.test(topic)) return null;
  const client = createServiceClient();
  const { data: cached } = await client.from("bible_topics").select("data").eq("topic", topic).maybeSingle();
  if (cached) return cached.data as TopicStudy;

  // A little protection against runaway costs.
  const { count } = await client.from("bible_topics").select("topic", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= 60) return null;

  const system = `You are a careful Bible teacher helping pastors in Ghana prepare messages. For a topic, return ONLY a JSON object:
{"meaning": "...", "words": [{"word": "...", "language": "Hebrew" or "Greek", "sense": "..."}], "points": ["..."], "scriptures": [{"ref": "Book C:V" or "Book C:V-V", "note": "..."}]}
- meaning: 80 to 140 words: what the Bible teaches this topic means, in simple English, faithful to mainstream Christian teaching.
- words: 1 to 3 key original-language words (transliterated) with a short sense. Only well-known, accurate ones; empty list if unsure.
- points: 3 to 5 short teaching points (one sentence each) a preacher could use.
- scriptures: 8 to 12 supporting KJV references from both Testaments, each with a one-sentence note on how it supports the topic. Only real references; prefer well-known passages; keep ranges short (max 5 verses).
No links, no emojis. If the topic is not a Bible or Christian-life topic, return {"meaning": "", "words": [], "points": [], "scriptures": []}.`;
  const out = await askJson(system, `Topic: ${topic}`, 3000);
  if (!out) return null;
  const meaning = cleanText(out.meaning, 1500);
  const scriptures: TopicStudy["scriptures"] = [];
  for (const s of Array.isArray(out.scriptures) ? out.scriptures : []) {
    const o = (s ?? {}) as Record<string, unknown>;
    const [ref] = await validRefs([o.ref], 1);
    if (ref && !scriptures.some((x) => x.ref === ref)) scriptures.push({ ref, note: cleanText(o.note, 240) });
    if (scriptures.length >= 12) break;
  }
  if (!meaning || scriptures.length < 2) return null;
  const study: TopicStudy = {
    topic,
    meaning,
    words: (Array.isArray(out.words) ? out.words : [])
      .slice(0, 3)
      .map((w) => {
        const o = (w ?? {}) as Record<string, unknown>;
        return { word: cleanText(o.word, 40), language: cleanText(o.language, 20), sense: cleanText(o.sense, 200) };
      })
      .filter((w) => w.word && w.sense),
    points: (Array.isArray(out.points) ? out.points : []).slice(0, 5).map((p) => cleanText(p, 240)).filter(Boolean),
    scriptures,
  };
  await client.from("bible_topics").upsert({ topic, data: study });
  return study;
}

// ---- Bible questions ("Who is a Christian?") --------------------------------

const QUESTION_WORDS = /^(who|what|whats|why|how|when|where|which|is|are|was|were|can|could|should|does|do|did|will|would|must|may|shall|explain|tell)\b/;
const STOP = new Set("who what whats why how when where which is are was were can could should does do did will would must may shall explain tell me us about the a an of to in on for and or be it its this that does say says bible scripture scriptures god's according i we you my our".split(" "));

export const cleanQuestion = (q: string) =>
  q
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9 '-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

/** "who is a christian?", "what does the bible say about tithing" → a question; "faith" → a topic. */
export function isQuestion(raw: string) {
  const q = cleanQuestion(raw);
  return raw.includes("?") || QUESTION_WORDS.test(q) || q.split(" ").length >= 5;
}

/** The main words of a question, for a plain verse search ("who is a christian" → "christian"). */
export function keyWords(raw: string) {
  return cleanQuestion(raw)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** An answer from Scripture to a Bible question, with KJV verses (checked), cached. */
export async function questionStudy(raw: string): Promise<TopicStudy | null> {
  const question = cleanQuestion(raw);
  if (!/^[a-z0-9][a-z0-9 '-]{2,139}$/.test(question)) return null;
  const client = createServiceClient();
  const { data: cached } = await client.from("bible_questions").select("data").eq("question", question).maybeSingle();
  if (cached) return cached.data as TopicStudy;

  const { count } = await client.from("bible_questions").select("question", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= 60) return null;

  const system = `You are a careful Bible teacher helping pastors and believers in Ghana. Answer the question from the Bible. Return ONLY a JSON object:
{"meaning": "...", "words": [{"word": "...", "language": "Hebrew" or "Greek", "sense": "..."}], "points": ["..."], "scriptures": [{"ref": "Book C:V" or "Book C:V-V", "note": "..."}]}
- meaning: the answer, 100 to 180 words, in simple English, faithful to mainstream Christian teaching. Let Scripture speak; where Christians differ, say so gently without taking sides.
- words: 0 to 3 key original-language words (transliterated) only if well known and accurate.
- points: 3 to 6 short points (one sentence each) that a preacher could teach.
- scriptures: 8 to 12 KJV references from both Testaments that back the answer, each with a one-sentence note on how it supports it. Only real references; prefer well-known passages; keep ranges short (max 5 verses).
No links, no emojis. If the question is not about the Bible, God or the Christian life, return {"meaning": "", "words": [], "points": [], "scriptures": []}.`;
  const out = await askJson(system, `Question: ${raw.trim().slice(0, 160)}`, 3200);
  if (!out) return null;
  const meaning = cleanText(out.meaning, 1800);
  const scriptures: TopicStudy["scriptures"] = [];
  for (const s of Array.isArray(out.scriptures) ? out.scriptures : []) {
    const o = (s ?? {}) as Record<string, unknown>;
    const [ref] = await validRefs([o.ref], 1);
    if (ref && !scriptures.some((x) => x.ref === ref)) scriptures.push({ ref, note: cleanText(o.note, 240) });
    if (scriptures.length >= 12) break;
  }
  if (!meaning || scriptures.length < 2) return null;
  const study: TopicStudy = {
    topic: question,
    meaning,
    words: (Array.isArray(out.words) ? out.words : [])
      .slice(0, 3)
      .map((w) => {
        const o = (w ?? {}) as Record<string, unknown>;
        return { word: cleanText(o.word, 40), language: cleanText(o.language, 20), sense: cleanText(o.sense, 200) };
      })
      .filter((w) => w.word && w.sense),
    points: (Array.isArray(out.points) ? out.points : []).slice(0, 6).map((p) => cleanText(p, 240)).filter(Boolean),
    scriptures,
  };
  await client.from("bible_questions").upsert({ question, data: study });
  return study;
}
