import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ArticleBody } from "@/features/articles/ArticleBody";
import { BibleShell } from "@/features/bible/BibleShell";
import { Passages } from "@/features/bible/Passages";
import { Quiz } from "@/features/bible/Quiz";
import { getSeries } from "@/db/bible";
import { parseQuiz } from "@/lib/bibleQuiz";

export const revalidate = 600;

async function load(params: Promise<{ series: string; lesson: string }>) {
  const { series, lesson } = await params;
  const s = await getSeries(series);
  const n = Number(lesson);
  if (!s || !Number.isInteger(n) || n < 1 || n > s.lessons.length) return null;
  return { s, n, l: s.lessons[n - 1] };
}

export async function generateMetadata({ params }: PageProps<"/bible/studies/[series]/[lesson]">): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Bible study" };
  return {
    title: { absolute: `Lesson ${found.n}: ${found.l.title} | ${found.s.title}` },
    description: `${found.s.title}, lesson ${found.n}: ${found.l.title}.${found.l.scripture ? ` Scripture: ${found.l.scripture}.` : ""} With a short quiz.`,
    alternates: { canonical: `/bible/studies/${found.s.slug}/${found.n}` },
  };
}

export default async function LessonPage({ params }: PageProps<"/bible/studies/[series]/[lesson]">) {
  const found = await load(params);
  if (!found) notFound();
  const { s, n, l } = found;
  const { questions } = parseQuiz(l.quiz);
  return (
    <BibleShell active="studies">
      <Container>
        <article className="mx-auto max-w-3xl py-10">
          <Link href={`/bible/studies/${s.slug}`} className="text-sm text-foreground/60 hover:text-brand-primary-text">
            ← {s.title}
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
            Lesson {n} of {s.lessons.length}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{l.title}</h1>
          {l.scripture && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Scripture</h2>
              <div className="mt-2">
                <Passages refs={l.scripture} />
              </div>
            </section>
          )}
          <div className="mt-6">
            <ArticleBody content={l.body} />
          </div>
          {questions.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold tracking-tight">Quiz</h2>
              <div className="mt-3">
                <Quiz lessonId={l.id} questions={questions} />
              </div>
            </section>
          )}
          <nav aria-label="Lessons" className="mt-10 flex items-center justify-between gap-3">
            {n > 1 ? (
              <Link href={`/bible/studies/${s.slug}/${n - 1}`} className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold dark:border-white/15">
                ← Lesson {n - 1}
              </Link>
            ) : (
              <span />
            )}
            {n < s.lessons.length && (
              <Link href={`/bible/studies/${s.slug}/${n + 1}`} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-on-primary">
                Lesson {n + 1} →
              </Link>
            )}
          </nav>
        </article>
      </Container>
    </BibleShell>
  );
}
