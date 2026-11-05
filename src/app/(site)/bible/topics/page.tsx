import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { BibleShell } from "@/features/bible/BibleShell";
import { chapterHref, parseReference } from "@/lib/bible";
import { getPassage } from "@/server/bible";
import { cleanTopic, topicStudy } from "@/server/bibleAuto";
import { createPublicClient } from "@/lib/supabase/public";

const SITE = process.env.SITE_URL || "https://zivarukah.com";
export const maxDuration = 60;

export async function generateMetadata({ searchParams }: PageProps<"/bible/topics">): Promise<Metadata> {
  const q = cleanTopic(String((await searchParams).q ?? ""));
  return q
    ? { title: { absolute: `What the Bible says about ${q}: meaning & scriptures | Repent Online Ministries` }, alternates: { canonical: `/bible/topics?q=${encodeURIComponent(q)}` } }
    : {
        title: { absolute: "Bible Topics: meaning and supporting scriptures | Repent Online Ministries" },
        description: "Type a topic such as forgiveness, faith or prayer and see its meaning, key words and supporting KJV scriptures. For pastors and Bible students.",
        alternates: { canonical: "/bible/topics" },
      };
}

const SUGGESTED = ["forgiveness", "faith", "prayer", "salvation", "holy spirit", "grace", "repentance", "fasting", "tithes and offerings", "marriage", "healing", "the blood of jesus"];

async function knownTopics() {
  try {
    const { data } = await createPublicClient().from("bible_topics").select("topic").order("created_at", { ascending: false }).limit(30);
    return (data ?? []).map((r) => r.topic as string);
  } catch {
    return [];
  }
}

function TopicForm({ q }: { q: string }) {
  return (
    <form action="/bible/topics" className="flex w-full max-w-xl gap-2">
      <input name="q" defaultValue={q} required minLength={3} maxLength={60} placeholder="e.g. forgiveness" aria-label="Topic" className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-4 py-2.5 text-base dark:border-white/15 dark:bg-zinc-900" />
      <button type="submit" className="rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c]">
        Research
      </button>
    </form>
  );
}

export default async function TopicsPage({ searchParams }: PageProps<"/bible/topics">) {
  const raw = String((await searchParams).q ?? "");
  const q = cleanTopic(raw);
  const study = q.length >= 3 ? await topicStudy(q) : null;
  const passages = study ? await Promise.all(study.scriptures.map(async (s) => ({ ...s, passage: await getPassage(s.ref) }))) : [];
  const topics = study ? [] : await knownTopics();
  const title = q.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <BibleShell active="topics">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight">{study ? `${title} in the Bible` : "Bible topics"}</h1>
          <p className="mt-1 text-foreground/70">Type a topic to see its meaning and the scriptures that teach it.</p>
          <div className="mt-4">
            <TopicForm q={q} />
          </div>

          {q && !study && (
            <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-amber-950 dark:bg-white/10 dark:text-white">
              Couldn&apos;t research “{q}” just now. Check the spelling, try a Bible topic (for example forgiveness, grace, prayer), or try again in a minute.
            </p>
          )}

          {study && (
            <div className="mt-8 flex flex-col gap-8">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Meaning</h2>
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

              {study.points.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Teaching points</h2>
                  <ol className="mt-2 ml-6 list-decimal space-y-2">
                    {study.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>
                </section>
              )}

              <section>
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

              <p className="text-xs text-foreground/60">
                Prepared with the help of AI and checked against the King James text: every verse shown is quoted from the KJV. Always study each passage in its context.
              </p>
              <ShareButtons
                label="Share"
                url={`${SITE}/bible/topics?q=${encodeURIComponent(q)}`}
                title={`${title} in the Bible`}
                message={`📖 *What the Bible says about ${q}*\n\nMeaning and ${study.scriptures.length} supporting scriptures 👇`}
              />
            </div>
          )}

          {!study && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Try a topic</h2>
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
