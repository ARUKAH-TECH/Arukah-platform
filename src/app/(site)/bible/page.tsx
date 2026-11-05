import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { ListenButton } from "@/features/quote/ListenButton";
import { BibleShell, SearchBox } from "@/features/bible/BibleShell";
import { ContinueReading } from "@/features/bible/ChapterReader";
import { InstallBible } from "@/features/bible/BibleApp";
import { BookGrid } from "@/features/bible/BookGrid";
import { verseOfTheDay } from "@/server/bible";
import { latestDevotional, listSeries } from "@/db/bible";
import { chapterHref, shareCardHref } from "@/lib/bible";

const SITE = process.env.SITE_URL || "https://zivarukah.com";

export const metadata: Metadata = {
  title: { absolute: "R.O.M Bible Guide: Holy Bible (KJV), Daily Devotional & Bible Studies | Repent Online Ministries" },
  description: "Read the King James Bible online with read-aloud, today's verse and devotional, and Bible studies with quizzes. Free, no sign-up. By Repent Online Ministries.",
  alternates: { canonical: "/bible" },
  openGraph: {
    title: "R.O.M Bible Guide | Repent Online Ministries",
    description: "Read the King James Bible with read-aloud, today's verse and devotional, and Bible studies with quizzes. Free.",
  },
};

export const revalidate = 600;

export default async function BibleHome() {
  const [verse, devotional, series] = await Promise.all([verseOfTheDay(), latestDevotional(), listSeries()]);
  const verseText = verse ? verse.verses.map((v) => v.text).join(" ") : "";

  return (
    <BibleShell active="home">
      <section className="bg-[#14110c] py-12 text-white">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#e3a82a]">Repent Online Ministries</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">R.O.M Bible Guide</h1>
          <p className="mt-2 max-w-xl text-white/75">King James Version, with read-aloud. A daily devotional and Bible studies. Free, nothing to sign up for.</p>
          <div className="mt-6 flex flex-col gap-4">
            <SearchBox dark />
            <div className="flex flex-wrap gap-3">
              <ContinueReading />
              <InstallBible />
              <Link href="/bible/books" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold">
                Open the Bible
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid grid-cols-1 gap-6 py-10 lg:grid-cols-2">
          {verse && (
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Verse of the day</p>
              <blockquote className="mt-3 font-serif text-xl leading-9">“{verseText}”</blockquote>
              <Link href={chapterHref(verse.ref.book.slug, verse.ref.chapter, verse.ref.from)} className="mt-2 inline-block font-semibold text-brand-primary-text underline">
                {verse.label} (KJV)
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ListenButton text={`${verseText} ${verse.label}.`} />
                <ShareButtons
                  label="Share"
                  url={`${SITE}/`}
                  title="Verse of the day"
                  image={shareCardHref(verse.ref)}
                  message={`📖 *Verse of the day*\n\n“${verseText}”\n— ${verse.label} (KJV)\n\n📖 Open *R.O.M Bible Guide* on our homepage 👇`}
                />
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Daily devotional</p>
            {devotional ? (
              <>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">{devotional.title}</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  {new Date(`${devotional.day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  {devotional.verseRef && ` · ${devotional.verseRef}`}
                </p>
                <p className="mt-3 line-clamp-4 text-foreground/80">{devotional.body.replace(/[#*>_[\]()]/g, "").slice(0, 400)}</p>
                <Link href={`/bible/devotionals/${devotional.day}`} className="mt-4 inline-block rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-on-primary">
                  Read today&apos;s devotional
                </Link>
              </>
            ) : (
              <p className="mt-3 text-foreground/70">The first devotional is coming soon. Meanwhile, read today&apos;s verse and open the Bible.</p>
            )}
          </section>
        </div>

        <section className="mb-10 rounded-3xl bg-[#14110c] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#e3a82a]">🧭 Bible research</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">What does the Bible say about…?</h2>
          <p className="mt-1 text-white/75">Type a topic such as forgiveness, faith or prayer: its meaning, key words, teaching points and supporting scriptures.</p>
          <form action="/bible/topics" className="mt-4 flex max-w-xl gap-2">
            <input name="q" required minLength={3} maxLength={60} placeholder="e.g. forgiveness" aria-label="Topic" className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-base text-white placeholder:text-white/50" />
            <button type="submit" className="rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c]">
              Research
            </button>
          </form>
        </section>

        {series.length > 0 && (
          <section className="pb-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight">Bible studies</h2>
              <Link href="/bible/studies" className="text-sm font-semibold text-brand-primary-text underline">
                All studies
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {series.slice(0, 6).map((s) => (
                <Link key={s.id} href={`/bible/studies/${s.slug}`} className="rounded-2xl border border-black/10 bg-white p-5 hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5">
                  <p className="text-lg font-bold">{s.title}</p>
                  {s.summary && <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{s.summary}</p>}
                  <p className="mt-2 text-xs font-semibold text-brand-primary-text">
                    {s.lessonCount} lesson{s.lessonCount === 1 ? "" : "s"} · with quizzes
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="pb-14">
          <h2 className="text-2xl font-bold tracking-tight">Books of the Bible</h2>
          <div className="mt-4">
            <BookGrid />
          </div>
        </section>
      </Container>
    </BibleShell>
  );
}
