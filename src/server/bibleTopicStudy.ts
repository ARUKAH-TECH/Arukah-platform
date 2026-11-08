import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { askGeminiGrounded, askJson, cleanText } from "@/server/ai";
import { getPassage } from "@/server/bible";
import { parseReference, refLabel } from "@/lib/bible";

// A full Bible study on any topic, for the "Study any topic" search in
// R.O.M Bible Guide → Studies. Before writing, it gathers research from:
//   • Easton's Bible Dictionary (1897, public domain, kept in src/data),
//   • Wikipedia (live, with a link back),
//   • Google Search through Gemini, when the free plan allows it.
// The study is then written from Scripture with those notes as background,
// every Bible reference is checked against the KJV, and it is saved so each
// topic is researched once.

export interface TopicBibleStudy {
  topic: string;
  title: string;
  overview: string;
  explain: string;
  background: string;
  words: { word: string; language: string; sense: string }[];
  examine: { ref: string; title: string; observe: string; interpret: string; apply: string }[];
  benefits: string[];
  negatives: string[];
  hard: { question: string; answer: string }[];
  views: string;
  discussion: string[];
  apply: string[];
  memoryVerse: string;
  summary: string;
  prayer: string;
  quiz: { question: string; options: string[]; answer: number; why: string }[];
  scriptures: { ref: string; note: string }[];
  sources: { name: string; url?: string; note?: string }[];
  /** Google's search-suggestions box (shown when Google Search was used). */
  searchHtml?: string;
}

const KEY = /^[a-z0-9][a-z0-9 '-]{1,79}$/;
export const cleanStudyTopic = (q: string) =>
  q
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9 '-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

// ---- Research --------------------------------------------------------------

let easton: Record<string, string[]> | null = null;

/** Entries from Easton's Bible Dictionary that match the topic. */
async function eastonEntries(topic: string) {
  easton ??= (await import("@/data/eastons.json")).default as Record<string, string[]>;
  const byLower = new Map(Object.keys(easton).map((k) => [k.toLowerCase(), k]));
  const words = topic.split(" ").filter((w) => w.length > 2);
  const tries = [topic, topic.replace(/(ness|ings?|es|s)$/, ""), ...words, ...words.map((w) => w.replace(/(ness|ings?|es|s)$/, ""))];
  const found: { term: string; text: string }[] = [];
  for (const t of tries) {
    if (!t || found.length >= 2) break;
    const keys = [byLower.get(t), ...[...byLower.keys()].filter((k) => k.startsWith(`${t},`) || k.startsWith(`${t} `)).slice(0, 2).map((k) => byLower.get(k))];
    for (const k of keys) {
      if (k && !found.some((f) => f.term === k)) found.push({ term: k, text: easton[k].join(" ").slice(0, 1800) });
      if (found.length >= 2) break;
    }
  }
  return found;
}

const UA = { "User-Agent": "ZIVARUKAH-BibleGuide/1.0 (https://zivarukah.com/bible)" };

/** A short summary of the best Wikipedia article on the topic (Christian context). */
async function wikipedia(topic: string) {
  try {
    const search = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(`${topic} Bible Christianity`)}&limit=3`, {
      headers: UA,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    if (!search.ok) return null;
    const pages = ((await search.json()) as { pages?: { key: string; title: string }[] }).pages ?? [];
    for (const page of pages) {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`, { headers: UA, signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
      if (!res.ok) continue;
      const s = (await res.json()) as { type?: string; title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
      if (s.type === "disambiguation" || !s.extract) continue;
      return { title: s.title ?? page.title, text: s.extract.slice(0, 1800), url: s.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}` };
    }
  } catch {
    // carry on without it
  }
  return null;
}

// ---- Writing the study -------------------------------------------------------

async function checkRef(value: unknown): Promise<string | null> {
  if (typeof value !== "string") return null;
  const ref = parseReference(value);
  if (!ref) return null;
  const passage = await getPassage(value);
  return passage && passage.verses.length ? refLabel(ref) : null;
}

const strings = (list: unknown, max: number, len: number) =>
  (Array.isArray(list) ? list : [])
    .slice(0, max)
    .map((x) => cleanText(x, len))
    .filter(Boolean);

// The study is written in two halves at the same time (faster, and each answer
// stays short enough not to be cut off).
const FORMAT_A = `Return ONLY a JSON object with these keys:
{"title": "...", "overview": "...", "explain": "...", "background": "...",
 "words": [{"word": "...", "language": "Hebrew" or "Greek", "sense": "..."}],
 "examine": [{"ref": "Book C:V-V", "title": "...", "observe": "...", "interpret": "...", "apply": "..."}],
 "benefits": ["..."], "negatives": ["..."]}
- title: a clear study title.
- overview: 100 to 160 words: what the topic is and why it matters for a Christian.
- explain: 180 to 280 words: a full explanation of what the Bible teaches about it.
- background: 100 to 180 words: origin and history, first mention in Scripture, development from Old to New Testament, and the culture of Bible times.
- words: 1 to 4 key Hebrew/Greek words (transliterated) with meanings; only well-known, accurate ones.
- examine: 4 to 6 key passages studied one by one: what it says (observe), what it means (interpret), what to do (apply), 1 to 3 sentences each.
- benefits: 4 to 6 benefits, blessings or promises of living it rightly.
- negatives: 4 to 6 negatives: dangers and consequences of neglecting it, ways it is misused or abused, and false teachings about it.`;

const FORMAT_B = `Return ONLY a JSON object with these keys:
{"hard": [{"question": "...", "answer": "..."}], "views": "...",
 "discussion": ["..."], "apply": ["..."], "memoryVerse": "Book C:V", "summary": "...", "prayer": "...",
 "quiz": [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "why": "..."}],
 "scriptures": [{"ref": "Book C:V" or "Book C:V-V", "note": "..."}]}
- hard: 3 to 5 difficult questions or deeper aspects of the topic, each answered from Scripture in 2 to 4 sentences.
- views: if faithful Christians hold different views on part of this topic, explain them fairly in 60 to 120 words without taking sides; otherwise "".
- discussion: 5 to 8 questions for a Bible study group.
- apply: 3 to 5 practical steps for this week.
- memoryVerse: one key verse reference.
- summary: 50 to 90 words summing up what the Bible teaches on the topic.
- prayer: 2 to 3 sentences.
- quiz: 5 multiple-choice questions on what the Bible teaches about the topic, 4 options each, answer = index (0-3) of the right option, why = one sentence with a reference.
- scriptures: 10 to 15 supporting KJV references from both Testaments, each with a one-sentence note.`;

const RULES = `Rules: Scripture is the final authority; use the research notes only for background and only where they agree with the Bible; never copy them word for word. Only real Bible references, short ranges (max 6 verses). Simple English. No links, no emojis.
Answer any topic connected with God, the Bible, faith, the church and its history, Christian living, morals or family. Only if it has nothing at all to do with these, return {}.`;

async function build(topic: string, out: Record<string, unknown>, sources: TopicBibleStudy["sources"], searchHtml: string): Promise<TopicBibleStudy | null> {
  const explain = cleanText(out.explain, 2600);
  const scriptures: TopicBibleStudy["scriptures"] = [];
  for (const s of Array.isArray(out.scriptures) ? out.scriptures : []) {
    const o = (s ?? {}) as Record<string, unknown>;
    const ref = await checkRef(o.ref);
    if (ref && !scriptures.some((x) => x.ref === ref)) scriptures.push({ ref, note: cleanText(o.note, 260) });
    if (scriptures.length >= 15) break;
  }
  if (!explain || scriptures.length < 3) return null;
  const examine: TopicBibleStudy["examine"] = [];
  for (const e of (Array.isArray(out.examine) ? out.examine : []).slice(0, 6)) {
    const o = (e ?? {}) as Record<string, unknown>;
    const ref = await checkRef(o.ref);
    if (!ref) continue;
    examine.push({ ref, title: cleanText(o.title, 120), observe: cleanText(o.observe, 500), interpret: cleanText(o.interpret, 600), apply: cleanText(o.apply, 400) });
  }
  const quiz: TopicBibleStudy["quiz"] = [];
  for (const q of (Array.isArray(out.quiz) ? out.quiz : []).slice(0, 6)) {
    const o = (q ?? {}) as Record<string, unknown>;
    const options = strings(o.options, 5, 160);
    const answer = Number(o.answer);
    const question = cleanText(o.question, 240);
    if (question && options.length >= 2 && Number.isInteger(answer) && answer >= 0 && answer < options.length) quiz.push({ question, options, answer, why: cleanText(o.why, 300) });
  }
  return {
    topic,
    title: cleanText(out.title, 120) || topic,
    overview: cleanText(out.overview, 1400),
    explain,
    background: cleanText(out.background, 1600),
    words: (Array.isArray(out.words) ? out.words : [])
      .slice(0, 4)
      .map((w) => {
        const o = (w ?? {}) as Record<string, unknown>;
        return { word: cleanText(o.word, 40), language: cleanText(o.language, 20), sense: cleanText(o.sense, 260) };
      })
      .filter((w) => w.word && w.sense),
    examine,
    benefits: strings(out.benefits, 6, 300),
    negatives: strings(out.negatives, 6, 300),
    hard: (Array.isArray(out.hard) ? out.hard : [])
      .slice(0, 5)
      .map((h) => {
        const o = (h ?? {}) as Record<string, unknown>;
        return { question: cleanText(o.question, 220), answer: cleanText(o.answer, 800) };
      })
      .filter((h) => h.question && h.answer),
    views: cleanText(out.views, 1000),
    discussion: strings(out.discussion, 8, 240),
    apply: strings(out.apply, 5, 260),
    memoryVerse: (await checkRef(out.memoryVerse)) ?? scriptures[0].ref,
    summary: cleanText(out.summary, 800),
    prayer: cleanText(out.prayer, 500),
    quiz,
    scriptures,
    sources,
    searchHtml: searchHtml || undefined,
  };
}

export type StudyState = { state: "ready"; study: TopicBibleStudy } | { state: "preparing" } | { state: "failed" } | { state: "none" };

/** What is saved for a topic: the study, "being prepared", "failed recently" or nothing. */
export async function savedTopicStudy(raw: string): Promise<StudyState> {
  const topic = cleanStudyTopic(raw);
  if (!KEY.test(topic)) return { state: "none" };
  const { data } = await createServiceClient().from("bible_topic_studies").select("data").eq("topic", topic).maybeSingle();
  const d = data?.data as (Partial<TopicBibleStudy> & { pending?: number; failed?: number }) | undefined;
  if (!d) return { state: "none" };
  if (d.explain) return { state: "ready", study: d as TopicBibleStudy };
  if (d.pending && Date.now() - d.pending < 4 * 60_000) return { state: "preparing" };
  if (d.failed && Date.now() - d.failed < 10 * 60_000) return { state: "failed" };
  return { state: "none" };
}

/**
 * Researches and writes the study, then saves it. Runs in the background
 * (the page shows "preparing" and refreshes itself). Returns true if saved.
 */
export async function prepareTopicStudy(raw: string): Promise<boolean> {
  const topic = cleanStudyTopic(raw);
  if (!KEY.test(topic)) return false;
  const client = createServiceClient();

  const { count } = await client.from("bible_topic_studies").select("topic", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= 40) return false;
  await client.from("bible_topic_studies").upsert({ topic, data: { pending: Date.now() } });

  // 1. Research, all at once.
  const [dictionary, wiki, google] = await Promise.all([
    eastonEntries(topic).catch(() => []),
    wikipedia(topic),
    askGeminiGrounded(
      `Research the Bible topic "${topic}" for a church Bible study: its meaning, origin and history, what major Christian sources and Bible commentaries say, its benefits, its dangers or misuses, and common questions people ask. Write clear notes (about 400 words). Mention where Christians hold different views.`,
    ),
  ]);
  const notes = [
    ...dictionary.map((d) => `From Easton's Bible Dictionary, "${d.term}": ${d.text}`),
    wiki ? `From Wikipedia, "${wiki.title}": ${wiki.text}` : "",
    google ? `From a Google search of Christian websites: ${google.text}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const sources: TopicBibleStudy["sources"] = [
    ...dictionary.map((d) => ({ name: `Easton's Bible Dictionary (1897): ${d.term}`, note: "Public domain" })),
    ...(wiki ? [{ name: `Wikipedia: ${wiki.title}`, url: wiki.url, note: "CC BY-SA" }] : []),
    ...(google?.sources ?? []).map((s) => ({ name: s.title, url: s.uri })),
  ];

  // 2. Write the study from Scripture, in two halves at the same time.
  const intro = "You are an experienced, careful Bible teacher preparing a complete Bible study for churches and Bible study groups in Ghana.";
  const prompt = `Topic: ${raw.trim().slice(0, 120)}\n\nResearch notes (background only; may contain mistakes):\n${notes || "(none found)"}`;
  const half = async (format: string, tokens: number) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const out = await askJson(`${intro}\n${format}\n${RULES}`, prompt, tokens);
      if (out && Object.keys(out).length) return out;
    }
    return null;
  };
  const [a, b] = await Promise.all([half(FORMAT_A, 4500), half(FORMAT_B, 4500)]);
  const study = a && b ? await build(topic, { ...a, ...b }, sources, google?.searchHtml ?? "") : null;
  if (!study) {
    await client.from("bible_topic_studies").upsert({ topic, data: { failed: Date.now() } });
    return false;
  }
  await client.from("bible_topic_studies").upsert({ topic, data: study });
  return true;
}
