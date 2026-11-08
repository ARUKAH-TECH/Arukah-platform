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
  /** 2 = the deeper study (origin, benefits, examples…). Older saved studies are redone when opened. */
  v?: number;
  meaning: string;
  origin?: string;
  words: { word: string; language: string; sense: string }[];
  points: string[];
  benefits?: string[];
  examples?: { name: string; ref: string; lesson: string }[];
  hard?: { question: string; answer: string }[];
  apply?: string[];
  prayer?: string;
  scriptures: { ref: string; note: string }[];
}

const STUDY_VERSION = 2;

const TOPIC = /^[a-z][a-z '-]{1,59}$/;
export const cleanTopic = (q: string) => q.toLowerCase().replace(/[^a-z '-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

const STUDY_FORMAT = `Return ONLY a JSON object:
{"meaning": "...", "origin": "...", "words": [{"word": "...", "language": "Hebrew" or "Greek", "sense": "..."}], "points": ["..."], "benefits": ["..."], "examples": [{"name": "...", "ref": "Book C:V-V", "lesson": "..."}], "hard": [{"question": "...", "answer": "..."}], "apply": ["..."], "prayer": "...", "scriptures": [{"ref": "Book C:V" or "Book C:V-V", "note": "..."}]}
- meaning: MEANING_RULE
- origin: 70 to 130 words on where it comes from: its first appearance in Scripture, how it develops from the Old Testament to the New, and the background in Bible times (culture, customs, history) that helps understand it.
- words: 1 to 4 key original-language words (transliterated) with their meaning; only well-known, accurate ones; empty list if unsure.
- points: 4 to 6 teaching points (one or two sentences each) a preacher could use.
- benefits: 3 to 6 benefits, blessings or promises for those who live it (or dangers of ignoring it), each one sentence.
- examples: 2 to 4 Bible people or events that show it, each with the passage and the lesson.
- hard: 2 to 4 difficult questions, common misunderstandings or deeper aspects people struggle with, each answered from Scripture in 2 to 4 sentences. Where faithful Christians differ, say so gently without taking sides.
- apply: 3 to 5 practical ways to live it today (in the home, church, work, community).
- prayer: a short prayer (2 to 3 sentences).
- scriptures: 10 to 15 supporting KJV references from both Testaments, each with a one-sentence note on how it supports the teaching. Only real references; prefer well-known passages; keep ranges short (max 5 verses).
Write in simple English, faithful to mainstream Christian teaching. No links, no emojis.`;

const strings = (list: unknown, max: number, len: number) =>
  (Array.isArray(list) ? list : [])
    .slice(0, max)
    .map((x) => cleanText(x, len))
    .filter(Boolean);

/** Turns the AI's answer into a checked study (every Bible reference must exist in the KJV). */
async function buildStudy(topic: string, out: Record<string, unknown>): Promise<TopicStudy | null> {
  const meaning = cleanText(out.meaning, 2000);
  const scriptures: TopicStudy["scriptures"] = [];
  for (const s of Array.isArray(out.scriptures) ? out.scriptures : []) {
    const o = (s ?? {}) as Record<string, unknown>;
    const [ref] = await validRefs([o.ref], 1);
    if (ref && !scriptures.some((x) => x.ref === ref)) scriptures.push({ ref, note: cleanText(o.note, 260) });
    if (scriptures.length >= 15) break;
  }
  if (!meaning || scriptures.length < 2) return null;
  const examples: NonNullable<TopicStudy["examples"]> = [];
  for (const e of (Array.isArray(out.examples) ? out.examples : []).slice(0, 4)) {
    const o = (e ?? {}) as Record<string, unknown>;
    const [ref] = await validRefs([o.ref], 1);
    const name = cleanText(o.name, 80);
    const lesson = cleanText(o.lesson, 320);
    if (name && lesson) examples.push({ name, ref: ref ?? "", lesson });
  }
  return {
    topic,
    v: STUDY_VERSION,
    meaning,
    origin: cleanText(out.origin, 1200),
    words: (Array.isArray(out.words) ? out.words : [])
      .slice(0, 4)
      .map((w) => {
        const o = (w ?? {}) as Record<string, unknown>;
        return { word: cleanText(o.word, 40), language: cleanText(o.language, 20), sense: cleanText(o.sense, 240) };
      })
      .filter((w) => w.word && w.sense),
    points: strings(out.points, 6, 320),
    benefits: strings(out.benefits, 6, 260),
    examples,
    hard: (Array.isArray(out.hard) ? out.hard : [])
      .slice(0, 4)
      .map((h) => {
        const o = (h ?? {}) as Record<string, unknown>;
        return { question: cleanText(o.question, 200), answer: cleanText(o.answer, 700) };
      })
      .filter((h) => h.question && h.answer),
    apply: strings(out.apply, 5, 260),
    prayer: cleanText(out.prayer, 500),
    scriptures,
  };
}

/**
 * A deep study (meaning, origin, original words, teaching points, benefits,
 * Bible examples, hard questions, application, prayer, scriptures), saved so
 * each topic/question is researched once. Older, shorter saved studies are
 * redone when opened (the old one is kept if the AI is unavailable).
 */
async function deepStudy(table: "bible_topics" | "bible_questions", column: "topic" | "question", key: string, system: string, prompt: string): Promise<TopicStudy | null> {
  const client = createServiceClient();
  const { data: cached } = await client.from(table).select("data").eq(column, key).maybeSingle();
  const old = cached ? (cached.data as TopicStudy) : null;
  if (old && (old.v ?? 1) >= STUDY_VERSION) return old;

  // A little protection against runaway costs (new studies per hour).
  if (!old) {
    const { count } = await client.from(table).select(column, { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) >= 60) return null;
  }

  let study: TopicStudy | null = null;
  const started = Date.now();
  for (let attempt = 0; attempt < 2 && !study && Date.now() - started < 60_000; attempt++) {
    const out = await askJson(system, prompt, 6000);
    if (out) study = await buildStudy(key, out);
  }
  if (!study) return old;
  await client.from(table).upsert({ [column]: key, data: study });
  return study;
}

/** A deep study of a Bible topic ("forgiveness"). */
export async function topicStudy(raw: string): Promise<TopicStudy | null> {
  const topic = cleanTopic(raw);
  if (!TOPIC.test(topic)) return null;
  const system = `You are a careful, deep Bible teacher helping pastors and Bible students in Ghana study a topic thoroughly.
${STUDY_FORMAT.replace("MEANING_RULE", "130 to 200 words: what the topic is and what the Bible teaches about it.")}
Answer any topic connected with God, the Bible, faith, the church, Christian living, morals or family life from a Bible perspective. Only if it has nothing at all to do with these, return {"meaning": "", "scriptures": []}.`;
  return deepStudy("bible_topics", "topic", topic, system, `Topic: ${topic}`);
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

/** A deep answer from Scripture to a Bible question ("Who is a Christian?"). */
export async function questionStudy(raw: string): Promise<TopicStudy | null> {
  const question = cleanQuestion(raw);
  if (!/^[a-z0-9][a-z0-9 '-]{2,139}$/.test(question)) return null;
  const system = `You are a careful, deep Bible teacher helping pastors and believers in Ghana. Answer the question thoroughly from the Bible.
${STUDY_FORMAT.replace("MEANING_RULE", "the answer, 150 to 230 words, clear and direct, letting Scripture speak.")}
Answer any question connected with God, the Bible, faith, the church and its history, Christian living, morals or family life from a Bible perspective. Only if it has nothing at all to do with these, return {"meaning": "", "scriptures": []}.`;
  return deepStudy("bible_questions", "question", question, system, `Question: ${raw.trim().slice(0, 160)}`);
}
