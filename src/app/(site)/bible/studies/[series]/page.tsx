import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { BibleShell } from "@/features/bible/BibleShell";
import { LessonTick } from "@/features/bible/Quiz";
import { getSeries } from "@/db/bible";
import { parseQuiz } from "@/lib/bibleQuiz";

export const revalidate = 600;

export async function generateMetadata({ params }: PageProps<"/bible/studies/[series]">): Promise<Metadata> {
  const s = await getSeries((await params).series);
  if (!s) return { title: "Bible study" };
  return {
    title: { absolute: `${s.title} | Bible Study, R.O.M Bible Guide` },
    description: s.summary.slice(0, 155) || `A Bible study in ${s.lessonCount} lessons, with quizzes.`,
    alternates: { canonical: `/bible/studies/${s.slug}` },
  };
}

export default async function SeriesPage({ params }: PageProps<"/bible/studies/[series]">) {
  const s = await getSeries((await params).series);
  if (!s) notFound();
  return (
    <BibleShell active="studies">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <Link href="/bible/studies" className="text-sm text-foreground/60 hover:text-brand-primary-text">
            ← All Bible studies
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{s.title}</h1>
          {s.summary && <p className="mt-2 text-foreground/75">{s.summary}</p>}
          {s.lessons.length === 0 ? (
            <p className="mt-8 text-foreground/70">Lessons are coming soon.</p>
          ) : (
            <ol className="mt-6 flex flex-col gap-3">
              {s.lessons.map((l, i) => (
                <li key={l.id}>
                  <Link
                    href={`/bible/studies/${s.slug}/${i + 1}`}
                    className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14110c] font-bold text-[#e3a82a]">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{l.title}</span>
                      {l.scripture && <span className="block truncate text-sm text-foreground/60">{l.scripture}</span>}
                    </span>
                    <LessonTick lessonId={l.id} total={parseQuiz(l.quiz).questions.length} />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Container>
    </BibleShell>
  );
}
