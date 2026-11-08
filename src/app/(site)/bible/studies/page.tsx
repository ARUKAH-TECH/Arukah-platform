import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BibleShell } from "@/features/bible/BibleShell";
import { listSeries } from "@/db/bible";
import { StudyTopicSearch } from "@/features/bible/StudyTopicSearch";

const EXAMPLES = ["Fasting", "The Holy Spirit", "Marriage", "Prayer", "Faith", "Forgiveness", "Tithes and offerings", "Spiritual warfare"];

export const metadata: Metadata = {
  title: { absolute: "Bible Studies with Quizzes | R.O.M Bible Guide" },
  description: "Step-by-step Bible studies from Repent Online Ministries, each lesson with scripture and a short quiz. Free.",
  alternates: { canonical: "/bible/studies" },
};
export const revalidate = 600;

export default async function StudiesPage() {
  const series = await listSeries();
  return (
    <BibleShell active="studies">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight">Bible studies</h1>
          <section className="mt-6 rounded-2xl border border-[#e3a82a]/50 bg-[#e3a82a]/10 p-4">
            <h2 className="font-bold">📚 Study any topic</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Type a topic and get a full Bible study: explained, examined passage by passage, origin, benefits, negatives and dangers, hard questions, discussion
              questions and a quiz, checked against Scripture with a Bible dictionary and other Christian sources.
            </p>
            <div className="mt-3">
              <StudyTopicSearch />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((t) => (
                <Link key={t} href={`/bible/studies/topic?q=${encodeURIComponent(t)}`} className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5">
                  {t}
                </Link>
              ))}
            </div>
          </section>
          <h2 className="mt-8 text-xl font-bold">Study series</h2>
          <p className="mt-1 text-foreground/70">Lessons in order, each with scripture and a short quiz.</p>
          {series.length === 0 ? (
            <p className="mt-8 text-foreground/70">The first Bible study is coming soon.</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {series.map((s) => (
                <li key={s.id}>
                  <Link href={`/bible/studies/${s.slug}`} className="block rounded-2xl border border-black/10 bg-white p-5 hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5">
                    <p className="text-xl font-bold">{s.title}</p>
                    {s.summary && <p className="mt-1 text-foreground/70">{s.summary}</p>}
                    <p className="mt-2 text-xs font-semibold text-brand-primary-text">
                      {s.lessonCount} lesson{s.lessonCount === 1 ? "" : "s"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </BibleShell>
  );
}
