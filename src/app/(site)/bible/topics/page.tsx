import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { BibleShell } from "@/features/bible/BibleShell";
import { chapterHref, parseReference } from "@/lib/bible";
import { getPassage, searchBible, type SearchHit } from "@/server/bible";
import { cleanQuestion, cleanTopic, isQuestion, keyWords, questionStudy, topicStudy } from "@/server/bibleAuto";
import { createPublicClient } from "@/lib/supabase/public";

const SITE = process.env.SITE_URL || "https://zivarukah.com";
export const maxDuration = 300; // a deep study can take the AI a minute or two the first time

export async function generateMetadata({ searchParams }: PageProps<"/bible/topics">): Promise<Metadata> {
  const raw = String((await searchParams).q ?? "");
  const asking = isQuestion(raw);
  const q = asking ? cleanQuestion(raw) : cleanTopic(raw);
  return q
    ? {
        title: { absolute: asking ? `${q.charAt(0).toUpperCase()}${q.slice(1)}? Answer with scriptures | R.O.M Bible Guide` : `What the Bible says about ${q}: meaning & scriptures | R.O.M Bible Guide` },
        alternates: { canonical: `/bible/topics?q=${encodeURIComponent(q)}` },
      }
    : {
        title: { absolute: "Bible Topics: meaning and supporting scriptures | R.O.M Bible Guide" },
        description: "Type a topic such as forgiveness, or a question such as Who is a Christian?, and get the meaning or answer with supporting KJV scriptures. For pastors and Bible students.",
        alternates: { canonical: "/bible/topics" },
      };
}

const QUESTIONS = ["Who is a Christian?", "What is salvation?", "How should a Christian pray?", "What does the Bible say about tithing?", "Why did Jesus die on the cross?", "How can I be born again?"];
const SUGGESTED = ["forgiveness", "faith", "prayer", "salvation", "holy spirit", "grace", "repentance", "fasting", "tithes and offerings", "marriage", "healing", "the blood of jesus"];

async function knownTopics() {
  try {
    const { data } = await createPublicClient().from("bible_topics").select("topic").order("created_at", { ascending: false }).limit(30);
    return (data ?? []).map((r) => r.topic as string);
  } catch {
    return [];
  }
}

/** Without AI: verses that use the word (and its root, e.g. forgiveness → forgive). */
async function keywordVerses(q: string, words?: string[]): Promise<SearchHit[]> {
  const roots = (w: string) => [w, w.replace(/(ness|ings?|ed|es|s)$/, ""), w.replace(/(ness|ings?|ed|es|s)$/, "").replace(/e$/, "")];
  const tries = words?.length ? words.flatMap(roots) : roots(q);
  const all: SearchHit[] = [];
  for (const t of [...new Set(tries)].filter((t) => t.length >= 3)) {
    const { hits } = await searchBible(t, 30);
    for (const h of hits) if (!all.some((x) => x.slug === h.slug && x.chapter === h.chapter && x.verse === h.verse)) all.push(h);
    if (all.length >= 30) break;
  }
  return all.slice(0, 30);
}

function TopicForm({ q }: { q: string }) {
  return (
    <form action="/bible/topics" className="flex w-full max-w-xl gap-2">
      <input name="q" defaultValue={q} required minLength={3} maxLength={140} placeholder="e.g. forgiveness, or Who is a Christian?" aria-label="Topic or question" className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-4 py-2.5 text-base dark:border-white/15 dark:bg-zinc-900" />
      <button type="submit" className="rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c]">
        Research
      </button>
    </form>
  );
}

export default async function TopicsPage({ searchParams }: PageProps<"/bible/topics">) {
  const raw = String((await searchParams).q ?? "");
  const asking = isQuestion(raw);
  const q = asking ? cleanQuestion(raw) : cleanTopic(raw);
  const study = q.length >= 3 ? await (asking ? questionStudy(raw) : topicStudy(q)) : null;
  const passages = study ? await Promise.all(study.scriptures.map(async (s) => ({ ...s, passage: await getPassage(s.ref) }))) : [];
  const topics = study ? [] : await knownTopics();
  const fallback = q.length >= 3 && !study ? await keywordVerses(q, asking ? keyWords(raw) : undefined) : [];
  const title = asking ? `${q.charAt(0).toUpperCase()}${q.slice(1)}?` : q.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <BibleShell active="topics">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight">{study ? (asking ? title : `${title} in the Bible`) : "Bible topics & questions"}</h1>
          <p className="mt-1 text-foreground/70">Type a topic (forgiveness) or a question (Who is a Christian?) to see what the Bible teaches, with scriptures.</p>
          <div className="mt-4">
            <TopicForm q={q} />
          </div>

          {q && !study && fallback.length === 0 && (
            <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-amber-950 dark:bg-white/10 dark:text-white">
              Couldn&apos;t answer “{q}” just now. Check the spelling, try a Bible topic or question (for example forgiveness, or Who is a Christian?), or try again later.
            </p>
          )}
          {q && !study && fallback.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Verses about “{asking ? keyWords(raw).join(", ") || q : q}” (KJV)</h2>
              <p className="mt-1 text-sm text-foreground/60">The full study with meaning and teaching points isn&apos;t available just now; here are the verses that speak of it.</p>
              <ul className="mt-3 flex flex-col gap-3">
                {fallback.map((h) => (
                  <li key={`${h.slug}.${h.chapter}.${h.verse}`} className="rounded-2xl border-l-4 border-brand-primary bg-white p-4 shadow-sm dark:bg-white/5">
                    <Link href={chapterHref(h.slug, h.chapter, h.verse)} className="font-bold text-brand-primary-text underline">
                      {h.slug === "psalms" ? "Psalm" : h.book} {h.chapter}:{h.verse}
                    </Link>
                    <p className="mt-1 font-serif leading-7">“{h.text}”</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {study && (
            <div className="mt-8 flex flex-col gap-8">
              {/* Quick links to each part of the study. */}
              <nav aria-label="On this page" className="flex flex-wrap gap-2 text-sm">
                {[
                  ["meaning", asking ? "Answer" : "Meaning"],
                  study.origin ? ["origin", "Origin"] : null,
                  study.points.length ? ["points", "Teaching"] : null,
                  study.benefits?.length ? ["benefits", "Benefits"] : null,
                  study.examples?.length ? ["examples", "Bible examples"] : null,
                  study.hard?.length ? ["hard", "Hard questions"] : null,
                  study.apply?.length ? ["apply", "Living it"] : null,
                  ["scriptures", "Scriptures"],
                  study.prayer ? ["prayer", "Prayer"] : null,
                ]
                  .filter((x): x is string[] => Boolean(x))
                  .map(([id, label]) => (
                    <a key={id} href={`#${id}`} className="rounded-full border border-brand-primary-text/40 px-3 py-1 hover:bg-brand-primary/10">
                      {label}
                    </a>
                  ))}
              </nav>

              <section id="meaning" className="scroll-mt-24">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">{asking ? "Answer from the Bible" : "Meaning"}</h2>
                <p className="mt-2 text-lg leading-8">{study.meaning}</p>
                {study.words.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {study.words.map((w) => (
                      <li key={w.word} className="rounded-xl bg-black/5 p-3 text-sm dark:bg-white/10">
                        <strong className="italic">{w.word}</strong> <span className="text-foreground/60">({w.language})</span>: {w.sense}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {study.origin && (
                <section id="origin" className="scroll-mt-24">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Origin &amp; background</h2>
                  <p className="mt-2 leading-8">{study.origin}</p>
                </section>
              )}

              {study.points.length > 0 && (
                <section id="points" className="scroll-mt-24">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">{asking ? "Key points" : "Teaching points"}</h2>
                  <ol className="mt-2 ml-6 list-decimal space-y-2">
                    {study.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>
                </section>
              )}

              {study.benefits && study.benefits.length > 0 && (
                <section id="benefits" className="scroll-mt-24">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Benefits &amp; promises</h2>
                  <ul className="mt-2 flex flex-col gap-2">
                    {study.benefits.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span aria-hidden="true">✅</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {study.examples && study.examples.length > 0 && (
                <section id="examples" className="scroll-mt-24">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Examples in the Bible</h2>
                  <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {study.examples.map((e) => {
                      const er = e.ref ? parseReference(e.ref) : null;
                      return (
                        <li key={e.name} className="rounded-2xl bg-black/5 p-4 dark:bg-white/10">
                          <p className="font-bold">{e.name}</p>
                          {er && (
                            <Link href={chapterHref(er.book.slug, er.chapter, er.from)} className="text-sm font-semibold text-brand-primary-text underline">
                              {e.ref}
                            </Link>
                          )}
                          <p className="mt-1 text-sm leading-6">{e.lesson}</p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {study.hard && study.hard.length > 0 && (
                <section id="hard" className="scroll-mt-24">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Hard questions &amp; deeper aspects</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {study.hard.map((h) => (
                      <details key={h.question} className="rounded-2xl border border-black/10 p-4 dark:border-white/10" open>
                        <summary className="cursor-pointer font-semibold">{h.question}</summary>
                        <p className="mt-2 leading-7 text-foreground/80">{h.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {study.apply && study.apply.length > 0 && (
                <section id="apply" className="scroll-mt-24">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Living it today</h2>
                  <ul className="mt-2 ml-6 list-disc space-y-2">
                    {study.apply.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section id="scriptures" className="scroll-mt-24">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Supporting scriptures (KJV)</h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {passages.map(({ ref, note, passage }) => {
                    const r = parseReference(ref);
                    return (
                      <li key={ref} className="rounded-2xl border-l-4 border-brand-primary bg-white p-4 shadow-sm dark:bg-white/5">
                        <Link href={r ? chapterHref(r.book.slug, r.chapter, r.from) : "/bible"} className="font-bold text-brand-primary-text underline">
                          {ref}
                        </Link>
                        {passage && <p className="mt-1 font-serif leading-7">“{passage.verses.map((v) => v.text).join(" ")}”</p>}
                        {note && <p className="mt-2 text-sm text-foreground/70">{note}</p>}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {study.prayer && (
                <section id="prayer" className="scroll-mt-24 rounded-2xl bg-[#14110c] p-5 text-white">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f0c050]">🙏 Prayer</h2>
                  <p className="mt-2 font-serif text-lg leading-8">{study.prayer}</p>
                </section>
              )}

              <p className="text-xs text-foreground/60">
                Prepared with the help of AI and checked against the King James text: every verse shown is quoted from the KJV. Always study each passage in its context.
              </p>
              <ShareButtons
                label="Share"
                url={`${SITE}/`}
                title={asking ? title : `${title} in the Bible`}
                message={`📖 *${asking ? title : `What the Bible says about ${q}`}*\n\n${asking ? "The answer" : "Meaning"}, origin, benefits, Bible examples, hard questions and ${study.scriptures.length} supporting scriptures.\n\n📖 Open *R.O.M Bible Guide* on our homepage 👇`}
              />
            </div>
          )}

          {!study && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Ask a question</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUESTIONS.map((t) => (
                  <Link key={t} href={`/bible/topics?q=${encodeURIComponent(t)}`} className="rounded-full border border-brand-primary-text/40 bg-brand-primary/10 px-3 py-1.5 text-sm hover:border-brand-primary-text">
                    {t}
                  </Link>
                ))}
              </div>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-foreground/60">Try a topic</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...new Set([...topics, ...SUGGESTED])].slice(0, 24).map((t) => (
                  <Link key={t} href={`/bible/topics?q=${encodeURIComponent(t)}`} className="rounded-full border border-black/15 px-3 py-1.5 text-sm hover:border-brand-primary-text dark:border-white/15">
                    {t}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>
    </BibleShell>
  );
}
