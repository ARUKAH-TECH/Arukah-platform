import type { Metadata } from "next";
import { after } from "next/server";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { BibleShell } from "@/features/bible/BibleShell";
import { Quiz } from "@/features/bible/Quiz";
import { StudyTopicSearch } from "@/features/bible/StudyTopicSearch";
import { chapterHref, parseReference } from "@/lib/bible";
import { getPassage } from "@/server/bible";
import { cleanStudyTopic, prepareTopicStudy, savedTopicStudy } from "@/server/bibleTopicStudy";

// A full Bible study on any topic: explain, examine, benefits, negatives,
// hard questions, discussion, application, quiz — researched once and saved.

export const maxDuration = 300; // the first study of a topic can take the AI a minute or two
const SITE = process.env.SITE_URL || "https://zivarukah.com";

export async function generateMetadata({ searchParams }: PageProps<"/bible/studies/topic">): Promise<Metadata> {
  const q = cleanStudyTopic(String((await searchParams).q ?? ""));
  return q
    ? { title: { absolute: `Bible study on ${q}: explained, examined, benefits & dangers | R.O.M Bible Guide` }, alternates: { canonical: `/bible/studies/topic?q=${encodeURIComponent(q)}` } }
    : { title: { absolute: "Bible study on any topic | R.O.M Bible Guide" }, alternates: { canonical: "/bible/studies/topic" } };
}

const H = "text-xs font-semibold uppercase tracking-wider text-brand-primary-text";

function RefLink({ refText }: { refText: string }) {
  const r = parseReference(refText);
  return r ? (
    <Link href={chapterHref(r.book.slug, r.chapter, r.from)} className="font-bold text-brand-primary-text underline">
      {refText}
    </Link>
  ) : (
    <span className="font-bold">{refText}</span>
  );
}

export default async function TopicStudyPage({ searchParams }: PageProps<"/bible/studies/topic">) {
  const params = await searchParams;
  const raw = String(params.q ?? "");
  const q = cleanStudyTopic(raw);
  const saved = q.length >= 2 ? await savedTopicStudy(raw) : ({ state: "none" } as const);
  let state = saved.state;
  // Not studied yet (or "try again"): prepare it in the background while this page
  // shows "preparing…" and refreshes itself every 15 seconds.
  if (q.length >= 2 && (state === "none" || (state === "failed" && params.retry === "1"))) {
    after(() => prepareTopicStudy(raw).catch(() => false));
    state = "preparing";
  }
  const study = saved.state === "ready" ? saved.study : null;
  const memory = study ? await getPassage(study.memoryVerse) : null;
  const passages = study ? await Promise.all(study.examine.map(async (e) => ({ ...e, passage: await getPassage(e.ref) }))) : [];
  const scriptures = study ? await Promise.all(study.scriptures.map(async (s) => ({ ...s, passage: await getPassage(s.ref) }))) : [];

  return (
    <BibleShell active="studies">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <Link href="/bible/studies" className="text-sm text-foreground/60 hover:underline">
            ← Bible studies
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{study ? study.title : "Bible study on any topic"}</h1>
          <div className="mt-4">
            <StudyTopicSearch defaultValue={study ? "" : q} />
          </div>

          {state === "preparing" && (
            <div className="mt-6 rounded-2xl bg-[#14110c] p-6 text-center text-white">
              <meta httpEquiv="refresh" content="15" />
              <p className="text-4xl">📚</p>
              <p className="mt-3 text-lg font-bold">Preparing a full Bible study on “{q}”…</p>
              <p className="mt-1 text-sm text-white/75">
                Checking the Scriptures, a Bible dictionary and other Christian sources. This takes one to two minutes the first time. This page refreshes by
                itself; you can also leave and come back.
              </p>
              <a href={`/bible/studies/topic?q=${encodeURIComponent(q)}`} className="mt-4 inline-block rounded-full bg-[#e3a82a] px-5 py-2 font-semibold text-[#14110c]">
                Refresh now
              </a>
            </div>
          )}
          {state === "failed" && (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <p>Couldn&apos;t prepare a study on “{q}” just now (the free AI may be busy). Please try again in a few minutes.</p>
              <a href={`/bible/studies/topic?q=${encodeURIComponent(q)}&retry=1`} className="mt-2 inline-block font-semibold underline">
                Try again
              </a>
            </div>
          )}

          {study && (
            <div className="mt-8 flex flex-col gap-8">
              <nav aria-label="On this page" className="flex flex-wrap gap-2 text-sm">
                {[
                  ["overview", "Overview"],
                  ["explain", "Explained"],
                  study.background ? ["background", "Origin"] : null,
                  study.examine.length ? ["examine", "Examined"] : null,
                  study.benefits.length ? ["benefits", "Benefits"] : null,
                  study.negatives.length ? ["negatives", "Negatives"] : null,
                  study.hard.length ? ["hard", "Hard questions"] : null,
                  study.discussion.length ? ["discussion", "Discussion"] : null,
                  study.quiz.length ? ["quiz", "Quiz"] : null,
                  ["scriptures", "Scriptures"],
                  ["sources", "Sources"],
                ]
                  .filter((x): x is string[] => Boolean(x))
                  .map(([id, label]) => (
                    <a key={id} href={`#${id}`} className="rounded-full border border-brand-primary-text/40 px-3 py-1 hover:bg-brand-primary/10">
                      {label}
                    </a>
                  ))}
              </nav>

              <section id="overview" className="scroll-mt-24">
                <h2 className={H}>Overview</h2>
                <p className="mt-2 text-lg leading-8">{study.overview}</p>
                {memory && (
                  <blockquote className="mt-4 rounded-2xl bg-[#14110c] p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#f0c050]">Memory verse</p>
                    <p className="mt-2 font-serif text-lg leading-8">“{memory.verses.map((v) => v.text).join(" ")}”</p>
                    <p className="mt-2 text-sm text-white/70">{study.memoryVerse} (KJV)</p>
                  </blockquote>
                )}
              </section>

              <section id="explain" className="scroll-mt-24">
                <h2 className={H}>Explained</h2>
                <p className="mt-2 leading-8">{study.explain}</p>
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

              {study.background && (
                <section id="background" className="scroll-mt-24">
                  <h2 className={H}>Origin &amp; background</h2>
                  <p className="mt-2 leading-8">{study.background}</p>
                </section>
              )}

              {passages.length > 0 && (
                <section id="examine" className="scroll-mt-24">
                  <h2 className={H}>Examining the Scriptures</h2>
                  <ol className="mt-3 flex flex-col gap-4">
                    {passages.map((e, i) => (
                      <li key={e.ref} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm text-foreground/60">
                          {i + 1}. <RefLink refText={e.ref} />
                          {e.title && <span className="font-semibold text-foreground"> · {e.title}</span>}
                        </p>
                        {e.passage && <p className="mt-2 font-serif leading-7">“{e.passage.verses.map((v) => v.text).join(" ")}”</p>}
                        {e.observe && (
                          <p className="mt-3 text-sm">
                            <strong>What it says:</strong> {e.observe}
                          </p>
                        )}
                        {e.interpret && (
                          <p className="mt-1 text-sm">
                            <strong>What it means:</strong> {e.interpret}
                          </p>
                        )}
                        {e.apply && (
                          <p className="mt-1 text-sm">
                            <strong>What to do:</strong> {e.apply}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {(study.benefits.length > 0 || study.negatives.length > 0) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {study.benefits.length > 0 && (
                    <section id="benefits" className="scroll-mt-24 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">✅ Benefits &amp; blessings</h2>
                      <ul className="mt-2 flex flex-col gap-2 text-sm leading-6">
                        {study.benefits.map((b) => (
                          <li key={b}>• {b}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {study.negatives.length > 0 && (
                    <section id="negatives" className="scroll-mt-24 rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">⚠️ Negatives, dangers &amp; misuse</h2>
                      <ul className="mt-2 flex flex-col gap-2 text-sm leading-6">
                        {study.negatives.map((n) => (
                          <li key={n}>• {n}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}

              {study.hard.length > 0 && (
                <section id="hard" className="scroll-mt-24">
                  <h2 className={H}>Hard questions &amp; deeper aspects</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {study.hard.map((h) => (
                      <details key={h.question} className="rounded-2xl border border-black/10 p-4 dark:border-white/10" open>
                        <summary className="cursor-pointer font-semibold">{h.question}</summary>
                        <p className="mt-2 leading-7 text-foreground/80">{h.answer}</p>
                      </details>
                    ))}
                  </div>
                  {study.views && (
                    <p className="mt-3 rounded-2xl bg-black/5 p-4 text-sm leading-6 dark:bg-white/10">
                      <strong>Where Christians differ:</strong> {study.views}
                    </p>
                  )}
                </section>
              )}

              {study.discussion.length > 0 && (
                <section id="discussion" className="scroll-mt-24">
                  <h2 className={H}>Questions for discussion</h2>
                  <ol className="mt-2 ml-6 list-decimal space-y-2">
                    {study.discussion.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ol>
                </section>
              )}

              {study.apply.length > 0 && (
                <section className="scroll-mt-24">
                  <h2 className={H}>Living it this week</h2>
                  <ul className="mt-2 ml-6 list-disc space-y-2">
                    {study.apply.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </section>
              )}

              {study.summary && (
                <section>
                  <h2 className={H}>Summary</h2>
                  <p className="mt-2 leading-8">{study.summary}</p>
                </section>
              )}

              {study.quiz.length > 0 && (
                <section id="quiz" className="scroll-mt-24">
                  <h2 className={H}>Quiz</h2>
                  <div className="mt-3">
                    <Quiz lessonId={`topic:${study.topic}`} questions={study.quiz} />
                  </div>
                </section>
              )}

              <section id="scriptures" className="scroll-mt-24">
                <h2 className={H}>Supporting scriptures (KJV)</h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {scriptures.map(({ ref, note, passage }) => (
                    <li key={ref} className="rounded-2xl border-l-4 border-brand-primary bg-white p-4 shadow-sm dark:bg-white/5">
                      <RefLink refText={ref} />
                      {passage && <p className="mt-1 font-serif leading-7">“{passage.verses.map((v) => v.text).join(" ")}”</p>}
                      {note && <p className="mt-2 text-sm text-foreground/70">{note}</p>}
                    </li>
                  ))}
                </ul>
              </section>

              {study.prayer && (
                <section className="rounded-2xl bg-[#14110c] p-5 text-white">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f0c050]">🙏 Prayer</h2>
                  <p className="mt-2 font-serif text-lg leading-8">{study.prayer}</p>
                </section>
              )}

              <section id="sources" className="scroll-mt-24">
                <h2 className={H}>Sources consulted</h2>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  <li>The Holy Bible, King James Version (every verse shown is quoted from it)</li>
                  {study.sources.map((s) => (
                    <li key={s.name}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                          {s.name}
                        </a>
                      ) : (
                        s.name
                      )}
                      {s.note && <span className="text-foreground/60"> ({s.note})</span>}
                    </li>
                  ))}
                </ul>
                {study.searchHtml && (
                  // Google's search suggestions, required with Google Search results; kept in a sandbox.
                  <iframe
                    title="Google search suggestions"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    srcDoc={`<base target="_blank">${study.searchHtml}`}
                    className="mt-3 h-24 w-full rounded-xl border-0"
                  />
                )}
                <p className="mt-3 text-xs text-foreground/60">
                  Prepared with the help of AI from Scripture, with the sources above as background. Study each passage in its context and test everything by the Word
                  of God (Acts 17:11).
                </p>
              </section>

              <ShareButtons
                label="Share"
                url={`${SITE}/`}
                title={study.title}
                message={`📚 *Bible study: ${study.title}*\n\nExplained, examined, benefits, dangers, hard questions, discussion and a quiz, with ${study.scriptures.length} scriptures.\n\n📖 Open *R.O.M Bible Guide* on our homepage 👇`}
              />
            </div>
          )}
        </div>
      </Container>
    </BibleShell>
  );
}
